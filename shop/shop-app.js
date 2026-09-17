(function () {
  "use strict";

  var CATEGORIES = [];
  var PRODUCTS = [];
  var PER_PAGE = 28;
  var ready = false;
  var BROWSE_ROOT_SLUGS = ["dropship-products", "pod-products", "uncategorized"];
  var DEFAULT_CATALOG_SLUG = "pod-products";
  var RV_KEY = "printuz_shop_recently_viewed";
  var RV_MAX = 3;
  var APP_LOGIN_URL = "https://app.printuz.com";

  var PRODUCT_ZOOM_ICON =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M8 16l7-7M14 8h3v3M8 14v3h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  var state = {
    sort: "default",
    minPrice: null,
    maxPrice: null,
    q: "",
    browseOpen: {},
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function formatPrice(cents) {
    if (cents == null) return "";
    return "$" + (cents / 100).toFixed(2);
  }

  function priceLabel(p) {
    if (p.priceMin != null) {
      if (p.priceMax != null && p.priceMax !== p.priceMin) {
        return formatPrice(p.priceMin) + " – " + formatPrice(p.priceMax);
      }
      return formatPrice(p.priceMin);
    }
    if (p.priceHtml) {
      return p.priceHtml.replace(/\s*Price range:.*/i, "").trim();
    }
    return "";
  }

  function categoriesById() {
    var map = {};
    CATEGORIES.forEach(function (c) {
      map[c.id] = c;
    });
    return map;
  }

  function categoryBySlug(slug) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].slug === slug) return CATEGORIES[i];
    }
    return null;
  }

  function descendantIds(catId) {
    var ids = [catId];
    var queue = [catId];
    while (queue.length) {
      var pid = queue.shift();
      CATEGORIES.forEach(function (c) {
        if (c.parent === pid && ids.indexOf(c.id) === -1) {
          ids.push(c.id);
          queue.push(c.id);
        }
      });
    }
    return ids;
  }

  function isDescendantOf(catId, ancestorId) {
    if (catId === ancestorId) return true;
    var byId = categoriesById();
    var cur = byId[catId];
    while (cur && cur.parent) {
      cur = byId[cur.parent];
      if (cur && cur.id === ancestorId) return true;
    }
    return false;
  }

  function productMatchesCategory(p, cat) {
    if (!cat || !p.categoryIds) return false;
    var ids = descendantIds(cat.id);
    for (var i = 0; i < p.categoryIds.length; i++) {
      if (ids.indexOf(p.categoryIds[i]) !== -1) return true;
    }
    return false;
  }

  function nameMatchScore(name, q) {
    var n = (name || "").toLowerCase();
    if (n === q) return 100;
    if (n.indexOf(q) === 0) return 80;
    if (n.indexOf(q) !== -1) return 60;
    return 0;
  }

  function filteredProducts(categorySlug, applyPrice) {
    if (applyPrice === undefined) applyPrice = true;
    var list = PRODUCTS.slice();
    if (state.q) {
      var q = state.q.toLowerCase();
      list = list.filter(function (p) {
        return nameMatchScore(p.name, q) > 0;
      });
    } else if (categorySlug) {
      var cat = categoryBySlug(categorySlug);
      if (cat) {
        list = list.filter(function (p) {
          return productMatchesCategory(p, cat);
        });
      }
    }
    if (applyPrice) {
      if (state.minPrice != null) {
        list = list.filter(function (p) {
          return p.priceMin != null && p.priceMin >= state.minPrice;
        });
      }
      if (state.maxPrice != null) {
        list = list.filter(function (p) {
          var hi = p.priceMax != null ? p.priceMax : p.priceMin;
          return hi != null && hi <= state.maxPrice;
        });
      }
    }
    if (state.sort === "price-asc") {
      list.sort(function (a, b) {
        return (a.priceMin || 0) - (b.priceMin || 0);
      });
    } else if (state.sort === "price-desc") {
      list.sort(function (a, b) {
        return (b.priceMin || 0) - (a.priceMin || 0);
      });
    } else if (state.sort === "latest") {
      list.sort(function (a, b) {
        return (b.wpId || 0) - (a.wpId || 0);
      });
    } else if (state.sort === "popularity") {
      list.sort(function (a, b) {
        return (a.wpId || 0) - (b.wpId || 0);
      });
    } else if (state.sort === "relevance" && state.q) {
      var qRel = state.q.toLowerCase();
      list.sort(function (a, b) {
        return nameMatchScore(b.name, qRel) - nameMatchScore(a.name, qRel);
      });
    }
    return list;
  }

  function priceSliderBounds(categorySlug) {
    var list = filteredProducts(categorySlug, false);
    var maxCents = 0;
    list.forEach(function (p) {
      var hi = p.priceMax != null ? p.priceMax : p.priceMin;
      if (hi != null && hi > maxCents) maxCents = hi;
    });
    if (!maxCents) maxCents = 12900;
    var maxDollars = Math.ceil(maxCents / 100);
    if (maxDollars < 10) maxDollars = 10;
    return maxDollars;
  }

  function productBySlug(slug) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === slug) return PRODUCTS[i];
    }
    return null;
  }

  function ensureBrowseOpen(activeSlug) {
    if (!activeSlug) return;
    var cat = categoryBySlug(activeSlug);
    if (!cat) return;
    var byId = categoriesById();
    var cur = cat;
    while (cur) {
      state.browseOpen[cur.slug] = true;
      if (!cur.parent) break;
      cur = byId[cur.parent];
    }
  }

  function browseChildren(parentId) {
    return CATEGORIES.filter(function (c) {
      return c.parent === parentId && (c.count || 0) > 0;
    }).sort(function (a, b) {
      return a.label.localeCompare(b.label);
    });
  }

  function browseCaretButton(slug, open) {
    return (
      '<button type="button" class="browse-caret-btn' +
      (open ? " open" : "") +
      '" data-browse="' +
      esc(slug) +
      '" aria-expanded="' +
      (open ? "true" : "false") +
      '" aria-label="Toggle category">' +
      '<span class="browse-caret" aria-hidden="true"></span></button>'
    );
  }

  function renderBrowseNode(c, activeSlug, isRoot) {
    var children = browseChildren(c.id);
    var hasKids = children.length > 0;
    var open = !!state.browseOpen[c.slug];
    var active = c.slug === activeSlug ? " active" : "";
    var caret = hasKids ? browseCaretButton(c.slug, open) : "";
    var sub =
      hasKids && open
        ? '<ul class="browse-children">' +
          children.map(function (ch) {
            return renderBrowseNode(ch, activeSlug, false);
          }).join("") +
          "</ul>"
        : "";
    var linkClass = isRoot ? "browse-root-link" : "browse-child-link";
    var rowClass = isRoot ? "browse-item-row browse-root-row" : "browse-item-row";
    var tag = isRoot ? "li" : "li";
    var liClass = isRoot ? "browse-root" : "browse-node";
    return (
      "<" +
      tag +
      ' class="' +
      liClass +
      '">' +
      '<div class="' +
      rowClass +
      '">' +
      '<a class="' +
      linkClass +
      active +
      '" href="#/category/' +
      esc(c.slug) +
      '">' +
      esc(c.label) +
      "</a>" +
      caret +
      "</div>" +
      sub +
      "</" +
      tag +
      ">"
    );
  }

  function renderPriceFilter(categorySlug) {
    var maxD = priceSliderBounds(categorySlug);
    var minD = state.minPrice != null ? Math.round(state.minPrice / 100) : 0;
    var maxSel = state.maxPrice != null ? Math.round(state.maxPrice / 100) : maxD;
    if (maxSel > maxD) maxSel = maxD;
    if (minD > maxSel) minD = maxSel;
    return (
      '<div class="sidebar-block">' +
      '<div class="sidebar-heading">FILTER BY PRICE</div>' +
      '<div class="price-slider-widget">' +
      '<div class="price-slider-wrap">' +
      '<div class="price-slider-rail"></div>' +
      '<input type="range" class="price-range price-range-min" id="priceRangeMin" min="0" max="' +
      maxD +
      '" value="' +
      minD +
      '" step="1">' +
      '<input type="range" class="price-range price-range-max" id="priceRangeMax" min="0" max="' +
      maxD +
      '" value="' +
      maxSel +
      '" step="1">' +
      "</div>" +
      '<div class="price-filter-actions">' +
      '<button type="button" class="btn-filter-price" id="shopPriceFilter">FILTER</button>' +
      '<span class="price-filter-label" id="priceFilterLabel">Price: <strong>$' +
      minD +
      " — $" +
      maxSel +
      "</strong></span>" +
      "</div></div></div>"
    );
  }

  function getRecentlyViewed() {
    try {
      var raw = localStorage.getItem(RV_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function pushRecentlyViewed(p) {
    if (!p) return;
    var item = {
      id: p.id,
      name: p.name,
      image: p.image || "",
      priceMin: p.priceMin,
      priceMax: p.priceMax,
    };
    var list = getRecentlyViewed().filter(function (x) {
      return x.id !== p.id;
    });
    list.unshift(item);
    if (list.length > RV_MAX) list = list.slice(0, RV_MAX);
    try {
      localStorage.setItem(RV_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function renderRecentlyViewed() {
    var items = getRecentlyViewed();
    if (!items.length) return "";
    var rows = items
      .map(function (item) {
        var thumb = item.image
          ? '<img src="' + esc(item.image) + '" alt="" loading="lazy">'
          : '<span class="rv-ph">•</span>';
        var price =
          item.priceMax != null && item.priceMax !== item.priceMin
            ? formatPrice(item.priceMin) + " – " + formatPrice(item.priceMax)
            : formatPrice(item.priceMin);
        return (
          '<div class="recently-viewed-item">' +
          '<a href="#/product/' +
          esc(item.id) +
          '" class="rv-thumb">' +
          thumb +
          "</a>" +
          '<div class="rv-meta">' +
          '<a href="#/product/' +
          esc(item.id) +
          '">' +
          esc(item.name) +
          "</a>" +
          '<div class="rv-price">' +
          esc(price) +
          "</div></div></div>"
        );
      })
      .join("");
    return (
      '<div class="sidebar-block">' +
      '<div class="sidebar-heading">RECENTLY VIEWED</div>' +
      '<div class="recently-viewed-list">' +
      rows +
      "</div></div>"
    );
  }

  function renderBrowseSidebar(activeSlug, opts) {
    opts = opts || {};
    var showPrice = opts.showPrice !== false;
    ensureBrowseOpen(activeSlug);
    var browseHtml = BROWSE_ROOT_SLUGS.map(function (slug) {
      var root = categoryBySlug(slug);
      if (!root) return "";
      return renderBrowseNode(root, activeSlug, true);
    }).join("");

    var orderClass = opts.contentFirst ? " order-2 order-lg-1" : "";

    return (
      '<aside class="col-lg-3 shop-sidebar' +
      orderClass +
      '">' +
      '<div class="sidebar-block">' +
      '<div class="sidebar-heading">BROWSE</div>' +
      '<ul class="browse-list">' +
      browseHtml +
      "</ul></div>" +
      (showPrice ? renderPriceFilter(activeSlug) : "") +
      renderRecentlyViewed() +
      "</aside>"
    );
  }

  function fullImageUrl(url) {
    if (!url) return url;
    return url.replace(/-\d+x\d+(?=\.\w+$)/i, "");
  }

  function galleryFromHtml(html) {
    if (!html) return [];
    var urls = [];
    var re = /<img[^>]+src=["']([^"']+)["']/gi;
    var m;
    while ((m = re.exec(html))) {
      if (m[1].indexOf("wp-content/uploads") !== -1) urls.push(m[1]);
    }
    return urls;
  }

  function getProductImages(p) {
    var list = [];
    if (p.images && p.images.length) {
      list = p.images.slice();
    } else {
      list = galleryFromHtml(p.descriptionHtml || "");
      if (p.image) list.unshift(p.image);
    }
    var seen = {};
    return list
      .map(fullImageUrl)
      .filter(function (u) {
        if (!u || seen[u]) return false;
        seen[u] = true;
        return true;
      });
  }

  function parseShortAttributes(short) {
    if (!short) return [];
    var keys = ["Material", "Product code", "Weight", "Production time"];
    var out = [];
    keys.forEach(function (key) {
      var re = new RegExp(key + "\\s*:", "i");
      if (!re.test(short)) return;
      var start = short.search(re);
      var after = short.slice(start);
      var colon = after.indexOf(":");
      var rest = after.slice(colon + 1);
      var end = rest.length;
      keys.forEach(function (other) {
        if (other === key) return;
        var nx = new RegExp("\\s" + other + "\\s*:", "i").exec(rest);
        if (nx && nx.index < end) end = nx.index;
      });
      var label = key;
      if (label.charAt(label.length - 1) !== ":") label += ":";
      out.push({ label: label, value: rest.slice(0, end).trim() });
    });
    return out;
  }

  function stripTags(html) {
    return String(html || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function specsFromHtmlTables(html) {
    if (!html || html.indexOf("<table") === -1) return [];
    var specs = [];
    var trRe = /<tr[\s\S]*?<\/tr>/gi;
    var tr;
    while ((tr = trRe.exec(html))) {
      var cells = [];
      var cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      var cell;
      while ((cell = cellRe.exec(tr[0]))) {
        var text = stripTags(cell[1]);
        if (text) cells.push(text);
      }
      if (cells.length >= 2) {
        var label = cells[0];
        if (label.charAt(label.length - 1) !== ":") label += ":";
        specs.push({ label: label, value: cells[1] });
      }
    }
    var specKeys = ["material", "product code", "weight", "production time"];
    var looksLikeSpecs = specs.some(function (row) {
      var l = row.label.toLowerCase();
      return specKeys.some(function (k) {
        return l.indexOf(k) !== -1;
      });
    });
    return looksLikeSpecs ? specs : [];
  }

  function specMapFromRows(rows) {
    var map = {};
    rows.forEach(function (row) {
      var key = row.label.toLowerCase().split(":")[0].trim();
      map[key] = row.value;
    });
    return map;
  }

  function inferMaterial(plain) {
    var m = plain.match(/Material:\s*([^\.]+)/i);
    if (m) return m[1].trim();
    m = plain.match(/Made from (?:high-quality )?([^,\.]+?)(?: combined| with|,|\.)/i);
    if (m) return m[1].trim();
    var words = ["Polyester", "Acrylic", "Cotton", "Leather", "Silicone", "Wood", "Metal", "Canvas", "Nylon"];
    for (var i = 0; i < words.length; i++) {
      if (new RegExp("\\b" + words[i] + "\\b", "i").test(plain)) return words[i];
    }
    return "—";
  }

  function inferModelFromHtml(html) {
    if (!html) return "";
    var m = html.match(/Model[\s\S]{0,900}?<td[^>]*>([A-Za-z0-9]+)<\/td>/i);
    return m ? m[1] : "";
  }

  function inferWeight(plain) {
    var m = plain.match(/Weight:\s*(\S+)/i);
    if (m) return m[1];
    m = plain.match(/\b(\d+(?:\.\d+)?\s*g)\b/i);
    if (m) return m[1].replace(/\s+/g, "");
    return "—";
  }

  function inferProduction(plain) {
    var m = plain.match(/Production time:\s*([^\.]+)/i);
    if (m && m[1].trim().length <= 24) return m[1].trim();
    m = plain.match(/\b(\d+\s*~\s*\d+\s*Days?)\b/i);
    if (m) return m[1].replace(/\s+/g, "");
    return "5~7 Days";
  }

  function normalizeProduction(value) {
    if (!value || value.length > 24 || /typically/i.test(value)) return "5~7 Days";
    return value;
  }

  function productCodeFallback(p, plain, html) {
    var m = plain.match(/Product code:\s*(\S+)/i);
    if (m) return m[1];
    var model = inferModelFromHtml(html);
    if (model) return model;
    if (p.wpId) return "P" + p.wpId;
    return (p.id || "").replace(/[^a-z0-9]/gi, "").slice(0, 10).toUpperCase() || "—";
  }

  function getProductSpecs(p) {
    if (p.specs && p.specs.length >= 4) return p.specs.slice(0, 4);
    var partial = [];
    if (p.specs && p.specs.length) partial = p.specs.slice();
    else {
      partial = parseShortAttributes(p.shortDescription || "");
      if (partial.length < 4) {
        partial = partial.concat(parseShortAttributes(stripTags(p.descriptionHtml || "").slice(0, 3500)));
      }
      if (partial.length < 4) {
        partial = partial.concat(specsFromHtmlTables(p.shortDescriptionHtml || ""));
      }
      if (partial.length < 4) {
        partial = partial.concat(specsFromHtmlTables(p.descriptionHtml || ""));
      }
    }
    var mapped = specMapFromRows(partial);
    var plain = stripTags(p.descriptionHtml || p.shortDescriptionHtml || "").slice(0, 3500);
    var html = p.descriptionHtml || p.shortDescriptionHtml || "";
    return [
      { label: "Material:", value: mapped.material || inferMaterial(plain) },
      { label: "Product code:", value: mapped["product code"] || productCodeFallback(p, plain, html) },
      { label: "Weight:", value: mapped.weight || inferWeight(plain) },
      {
        label: "Production time:",
        value: normalizeProduction(mapped["production time"] || inferProduction(plain)),
      },
    ];
  }

  function stripGalleryFromHtml(html) {
    if (!html) return "";
    return html
      .replace(/<div[^>]*class="[^"]*gallery[^"]*"[\s\S]*?<\/div>/gi, "")
      .replace(/<figure[^>]*class="[^"]*gallery-item[^"]*"[\s\S]*?<\/figure>/gi, "")
      .trim();
  }

  function productPrimaryCategory(p) {
    var byId = categoriesById();
    var best = null;
    var bestDepth = -1;
    (p.categoryIds || []).forEach(function (cid) {
      var cur = byId[cid];
      if (!cur) return;
      var depth = 0;
      var walk = cur;
      while (walk && walk.parent) {
        depth++;
        walk = byId[walk.parent];
      }
      if (depth > bestDepth) {
        bestDepth = depth;
        best = cur;
      }
    });
    return best;
  }

  function productBreadcrumbCategory(p) {
    var byId = categoriesById();
    var pod = categoryBySlug("pod-products");
    var podId = pod ? pod.id : 361;
    var crumbCat = null;
    (p.categoryIds || []).forEach(function (cid) {
      var c = byId[cid];
      if (!c || !c.parent) return;
      if (byId[c.parent] && byId[c.parent].id === podId) {
        if (!crumbCat || (c.count || 0) > (crumbCat.count || 0)) crumbCat = c;
      }
    });
    if (!crumbCat) {
      var leaf = productPrimaryCategory(p);
      if (leaf) {
        var parent = leaf.parent ? byId[leaf.parent] : null;
        crumbCat = parent && parent.id !== podId ? parent : leaf;
      }
    }
    return crumbCat;
  }

  function categoryChainFromSlug(slug) {
    var byId = categoriesById();
    var cat = categoryBySlug(slug);
    if (!cat) return [];
    var chain = [];
    var walk = cat;
    while (walk) {
      chain.unshift(walk);
      walk = walk.parent ? byId[walk.parent] : null;
    }
    return chain;
  }

  /** HOME / POD PRODUCTS / … — same trail on category archive and product detail. */
  function wooCategoryBreadcrumbHtml(categorySlug, opts) {
    opts = opts || {};
    var html = '<a href="index.html">HOME</a>';
    if (!categorySlug) return html;

    var pod = categoryBySlug("pod-products");
    var podId = pod ? pod.id : 361;
    var chain = categoryChainFromSlug(categorySlug);
    if (!chain.length) return html;

    if (categorySlug === "pod-products") {
      html += '<span class="woo-bc-sep">/</span><span class="woo-bc-current">POD PRODUCTS</span>';
      return html;
    }

    var podIdx = -1;
    for (var i = 0; i < chain.length; i++) {
      if (chain[i].id === podId) podIdx = i;
    }

    if (podIdx >= 0) {
      html += '<span class="woo-bc-sep">/</span><a href="#/category/pod-products">POD PRODUCTS</a>';
      var tail = chain.slice(podIdx + 1);
      for (var j = 0; j < tail.length; j++) {
        var c = tail[j];
        var isLast = j === tail.length - 1;
        html += '<span class="woo-bc-sep">/</span>';
        if (isLast && opts.lastIsLink) {
          html +=
            '<a href="#/category/' +
            esc(c.slug) +
            '" class="woo-bc-current">' +
            esc(c.label).toUpperCase() +
            "</a>";
        } else if (isLast) {
          html += '<span class="woo-bc-current">' + esc(c.label).toUpperCase() + "</span>";
        } else {
          html +=
            '<a href="#/category/' +
            esc(c.slug) +
            '">' +
            esc(c.label).toUpperCase() +
            "</a>";
        }
      }
      return html;
    }

    var last = chain[chain.length - 1];
    html += '<span class="woo-bc-sep">/</span>';
    if (opts.lastIsLink) {
      html +=
        '<a href="#/category/' +
        esc(last.slug) +
        '" class="woo-bc-current">' +
        esc(last.label).toUpperCase() +
        "</a>";
    } else {
      html += '<span class="woo-bc-current">' + esc(last.label).toUpperCase() + "</span>";
    }
    return html;
  }

  function productBreadcrumbHtml(p) {
    var crumbCat = productBreadcrumbCategory(p);
    var slug = crumbCat ? crumbCat.slug : DEFAULT_CATALOG_SLUG;
    return wooCategoryBreadcrumbHtml(slug, { lastIsLink: true });
  }

  function relatedProducts(p, limit) {
    limit = limit || 8;
    var cat = productPrimaryCategory(p);
    if (!cat) return [];
    return filteredProducts(cat.slug, false)
      .filter(function (x) {
        return x.id !== p.id;
      })
      .slice(0, limit);
  }

  function renderShippingTable() {
    return (
      '<div class="shipping-table-wrap">' +
      '<table class="shipping-table">' +
      "<thead><tr>" +
      '<th rowspan="2">Region</th>' +
      '<th colspan="2">Standard shipping<br><span class="subhead">(Average fulfillment time 12–20 business days)</span></th>' +
      '<th colspan="2">Express shipping<br><span class="subhead">(Average fulfillment time 3–8 business days)</span></th>' +
      "</tr><tr>" +
      "<th>First item</th><th>Next item</th><th>First item</th><th>Next item</th>" +
      "</tr></thead><tbody>" +
      "<tr><th>A zone</th><td>$6.69</td><td>$3.78</td><td>$27.52</td><td>$27.52</td></tr>" +
      "<tr><th>B zone</th><td>$8.46</td><td>$4.62</td><td>$28.27</td><td>$28.27</td></tr>" +
      "<tr><th>C zone</th><td>$8.46</td><td>$4.62</td><td>$67.60</td><td>$67.60</td></tr>" +
      "<tr><th>D zone</th><td>$10.77</td><td>$7.38</td><td>$24.07</td><td>$24.07</td></tr>" +
      "<tr><th>E zone</th><td>/</td><td>/</td><td>$67.60</td><td>$67.60</td></tr>" +
      "</tbody></table></div>"
    );
  }

  function renderWholesaleTable(p) {
    if (!p.priceMin) {
      return "<p>Contact Printuz for wholesale pricing.</p>";
    }
    var base = p.priceMin;
    var tier2 = Math.round(base * 0.909);
    var tier3 = Math.round(base * 0.818);
    return (
      '<div class="shipping-table-wrap">' +
      '<table class="shipping-table wholesale-table">' +
      "<thead><tr>" +
      "<th>1–9 Pieces</th><th>10–49 Pieces</th><th>50–9999 Pieces</th>" +
      "</tr></thead><tbody><tr>" +
      "<td>" +
      esc(formatPrice(base)) +
      "</td><td>" +
      esc(formatPrice(tier2)) +
      "</td><td>" +
      esc(formatPrice(tier3)) +
      "</td></tr></tbody></table></div>"
    );
  }

  function renderRelatedCarousel(list) {
    if (!list.length) return "";
    var cards = list
      .map(function (rp) {
        var img = rp.image
          ? '<img src="' + esc(rp.image) + '" alt="" loading="lazy">'
          : "";
        var cat =
          rp.categoryLabels && rp.categoryLabels.length
            ? '<div class="related-card-cat">' + esc(rp.categoryLabels[0]).toUpperCase() + "</div>"
            : "";
        return (
          '<a class="related-card" href="#/product/' +
          esc(rp.id) +
          '">' +
          '<span class="related-card-thumb">' +
          img +
          "</span>" +
          cat +
          '<div class="related-card-name">' +
          esc(rp.name) +
          "</div>" +
          '<div class="related-card-price">' +
          esc(priceLabel(rp)) +
          "</div></a>"
        );
      })
      .join("");
    return (
      '<section class="related-products-section">' +
      '<h2 class="related-products-heading">Related products</h2>' +
      '<div class="related-carousel" data-related-count="' +
      list.length +
      '">' +
      '<button type="button" class="related-nav-btn prev" aria-label="Previous">&lsaquo;</button>' +
      '<div class="related-track-wrap"><div class="related-track">' +
      cards +
      "</div></div>" +
      '<button type="button" class="related-nav-btn next" aria-label="Next">&rsaquo;</button>' +
      "</div></section>"
    );
  }

  function bindProductDetail() {
    var mainImg = document.getElementById("productMainImage");
    var images = [];
    document.querySelectorAll(".product-thumb-btn").forEach(function (btn) {
      var src = btn.getAttribute("data-src");
      if (src) images.push(src);
    });
    if (!images.length && mainImg && mainImg.src) images = [mainImg.src];

    var galleryIndex = 0;
    function showGalleryAt(index) {
      if (!mainImg || !images.length) return;
      if (index < 0) index = 0;
      if (index >= images.length) index = images.length - 1;
      galleryIndex = index;
      mainImg.src = images[index];
      mainImg.setAttribute("data-gallery-index", String(index));
      document.querySelectorAll(".product-thumb-btn").forEach(function (btn, i) {
        btn.classList.toggle("is-active", i === index);
      });
      var gPrev = document.getElementById("productGalleryPrev");
      var gNext = document.getElementById("productGalleryNext");
      if (gPrev) gPrev.disabled = index <= 0;
      if (gNext) gNext.disabled = index >= images.length - 1;
    }

    document.querySelectorAll(".product-thumb-btn").forEach(function (btn, i) {
      btn.onclick = function () {
        showGalleryAt(i);
      };
    });
    var gPrev = document.getElementById("productGalleryPrev");
    var gNext = document.getElementById("productGalleryNext");
    if (gPrev) {
      gPrev.onclick = function () {
        showGalleryAt(galleryIndex - 1);
      };
    }
    if (gNext) {
      gNext.onclick = function () {
        showGalleryAt(galleryIndex + 1);
      };
    }
    if (images.length) showGalleryAt(0);

    var lightbox = document.getElementById("productLightbox");
    var lbImg = document.getElementById("productLightboxImg");
    var lbCounter = document.getElementById("productLightboxCounter");
    var lbClose = document.getElementById("productLightboxClose");
    var lbBackdrop = document.getElementById("productLightboxBackdrop");
    var lbPrev = document.getElementById("productLightboxPrev");
    var lbNext = document.getElementById("productLightboxNext");
    var lbZoom = document.getElementById("productLightboxZoom");
    var lbIndex = 0;

    function updateLightboxImage() {
      if (!lbImg || !images.length) return;
      lbImg.src = images[lbIndex];
      lbImg.classList.remove("is-zoomed");
      if (lbCounter) {
        lbCounter.textContent = lbIndex + 1 + " / " + images.length;
      }
      if (lbPrev) lbPrev.style.visibility = images.length > 1 ? "visible" : "hidden";
      if (lbNext) lbNext.style.visibility = images.length > 1 ? "visible" : "hidden";
    }

    function openLightbox(atIndex) {
      if (!lightbox || !images.length) return;
      lbIndex = typeof atIndex === "number" ? atIndex : galleryIndex;
      if (lbIndex < 0) lbIndex = 0;
      if (lbIndex >= images.length) lbIndex = images.length - 1;
      updateLightboxImage();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lbImg) lbImg.classList.remove("is-zoomed");
    }

    function lightboxStep(delta) {
      if (!images.length) return;
      lbIndex += delta;
      if (lbIndex < 0) lbIndex = images.length - 1;
      if (lbIndex >= images.length) lbIndex = 0;
      updateLightboxImage();
      showGalleryAt(lbIndex);
    }

    if (mainImg) {
      mainImg.onclick = function () {
        openLightbox(galleryIndex);
      };
    }
    var zoomOpen = document.getElementById("productZoomOpen");
    if (zoomOpen) {
      zoomOpen.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        openLightbox(galleryIndex);
      };
    }
    if (lbClose) lbClose.onclick = closeLightbox;
    if (lbBackdrop) lbBackdrop.onclick = closeLightbox;
    if (lbPrev) lbPrev.onclick = function () { lightboxStep(-1); };
    if (lbNext) lbNext.onclick = function () { lightboxStep(1); };
    if (lbZoom && lbImg) {
      lbZoom.onclick = function () {
        lbImg.classList.toggle("is-zoomed");
      };
      lbImg.onclick = function () {
        if (lbImg.classList.contains("is-zoomed")) {
          lbImg.classList.remove("is-zoomed");
        }
      };
    }
    lightbox._lightboxStep = lightboxStep;
    lightbox._closeLightbox = closeLightbox;

    var panels = document.querySelectorAll(".product-tab-panel");
    document.querySelectorAll(".product-tab-btn").forEach(function (btn) {
      btn.onclick = function () {
        var tab = btn.getAttribute("data-tab");
        document.querySelectorAll(".product-tab-btn").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        panels.forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-panel") === tab);
        });
      };
    });

    var carousel = document.querySelector(".related-carousel");
    if (!carousel) return;
    var track = carousel.querySelector(".related-track");
    var prev = carousel.querySelector(".related-nav-btn.prev");
    var next = carousel.querySelector(".related-nav-btn.next");
    if (!track || !prev || !next) return;
    var index = 0;
    var cards = track.querySelectorAll(".related-card");
    var perView = 4;
    function updatePerView() {
      if (window.innerWidth < 576) perView = 1;
      else if (window.innerWidth < 992) perView = 2;
      else perView = 4;
    }
    function maxIndex() {
      return Math.max(0, cards.length - perView);
    }
    function apply() {
      updatePerView();
      if (index > maxIndex()) index = maxIndex();
      var card = cards[0];
      if (!card) return;
      var gap = 20;
      var step = card.offsetWidth + gap;
      track.style.transform = "translateX(-" + index * step + "px)";
      prev.disabled = index <= 0;
      next.disabled = index >= maxIndex();
    }
    prev.onclick = function () {
      if (index > 0) {
        index--;
        apply();
      }
    };
    next.onclick = function () {
      if (index < maxIndex()) {
        index++;
        apply();
      }
    };
    window.addEventListener("resize", apply);
    apply();
  }

  function breadcrumbLabel(categorySlug) {
    if (state.q) return "Search results";
    if (categorySlug) {
      return (categoryBySlug(categorySlug) || { label: categorySlug }).label;
    }
    return (categoryBySlug(DEFAULT_CATALOG_SLUG) || { label: "POD Products" }).label;
  }

  function normalizeHash() {
    var hash = window.location.hash || "";
    if (/^#\/search\b/.test(hash)) return false;
    if (!hash || hash === "#/page/1") {
      var target = "#/category/" + DEFAULT_CATALOG_SLUG;
      if (location.hash !== target) {
        location.replace(target);
        return true;
      }
    }
    return false;
  }

  function shopTopBar(total, categorySlug, page, perPage, isSearch) {
    page = page > 0 ? page : 1;
    perPage = perPage || PER_PAGE;
    var breadcrumb;
    if (isSearch) {
      var qLabel = state.q || "";
      breadcrumb =
        '<a href="index.html">HOME</a>' +
        '<span class="woo-bc-sep">/</span>' +
        '<a href="shop.html#/category/' +
        DEFAULT_CATALOG_SLUG +
        '">SHOP</a>' +
        '<span class="woo-bc-sep">/</span>' +
        '<span class="woo-bc-current">SEARCH RESULTS FOR “' +
        esc(qLabel) +
        "”</span>";
    } else {
      breadcrumb = wooCategoryBreadcrumbHtml(categorySlug || DEFAULT_CATALOG_SLUG, { lastIsLink: false });
    }
    var start = total ? (page - 1) * perPage + 1 : 0;
    var end = total ? Math.min(page * perPage, total) : 0;
    var resultText =
      total === 0
        ? "Showing 0 results"
        : total === 1
          ? "Showing the single result"
          : "Showing " + start + "–" + end + " of " + total + " results";
    var sortOptions =
      (isSearch
        ? '<option value="relevance">Relevance</option>'
        : '<option value="default">Default sorting</option>') +
      '<option value="popularity">Sort by popularity</option>' +
      '<option value="latest">Sort by latest</option>' +
      '<option value="price-asc">Sort by price: low to high</option>' +
      '<option value="price-desc">Sort by price: high to low</option>';
    return (
      '<div class="shop-topbar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">' +
      '<nav class="woo-breadcrumb" aria-label="Breadcrumb">' +
      breadcrumb +
      "</nav>" +
      '<div class="shop-ordering d-flex flex-wrap align-items-center gap-2">' +
      '<span class="shop-result-count">' +
      esc(resultText) +
      "</span>" +
      '<select id="shopSort" class="form-select form-select-sm shop-order-select" aria-label="Sort">' +
      sortOptions +
      "</select></div></div>"
    );
  }

  function productCard(p) {
    var img = p.image
      ? '<img src="' + esc(p.image) + '" alt="" loading="lazy">'
      : '<span class="placeholder">Printuz</span>';
    var sale = p.onSale ? '<span class="sale-badge">Sale</span>' : "";
    var catTag =
      p.categoryLabels && p.categoryLabels.length
        ? '<div class="product-cat-tag">' + esc(p.categoryLabels[0]).toUpperCase() + "</div>"
        : "";
    return (
      '<div class="col"><article class="product-card">' +
      sale +
      '<a href="#/product/' +
      esc(p.id) +
      '" class="product-thumb">' +
      img +
      "</a>" +
      catTag +
      '<h3 class="product-name"><a href="#/product/' +
      esc(p.id) +
      '">' +
      esc(p.name) +
      "</a></h3>" +
      '<div class="product-price">' +
      esc(priceLabel(p)) +
      "</div></article></div>"
    );
  }

  function pagination(page, totalPages, baseHash) {
    if (totalPages <= 1) return "";
    baseHash = baseHash || "#/page/";
    var nums = [];
    for (var n = 1; n <= Math.min(5, totalPages); n++) {
      nums.push(pageLink(n, page, baseHash));
    }
    var prev = Math.max(1, page - 1);
    var next = Math.min(totalPages, page + 1);
    return (
      '<nav class="news-pagination">' +
      (page > 1 ? '<a href="' + baseHash + prev + '" class="page-num">&lsaquo;</a>' : "") +
      nums.join("") +
      (totalPages > 5
        ? '<span class="page-dots">&hellip;</span><a href="' + baseHash + totalPages + '" class="page-num">' + totalPages + "</a>"
        : "") +
      (page < totalPages ? '<a href="' + baseHash + next + '" class="page-num">&rsaquo;</a>' : "") +
      "</nav>"
    );
  }

  function pageLink(n, page, baseHash) {
    var cls = n === page ? " page-num active" : " page-num";
    return '<a href="' + baseHash + n + '" class="' + cls.trim() + '">' + n + "</a>";
  }

  function searchHashToken() {
    return state.q ? encodeURIComponent(state.q) : "-";
  }

  function renderCatalog(page, categorySlug, isSearch) {
    page = page > 0 ? page : 1;
    var list = filteredProducts(isSearch ? null : categorySlug);
    var totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (page > totalPages) page = totalPages;
    var start = (page - 1) * PER_PAGE;
    var slice = list.slice(start, start + PER_PAGE);

    var title = isSearch
      ? state.q
        ? 'Search: "' + state.q + '"'
        : "Search results"
      : breadcrumbLabel(categorySlug);
    document.title = (page > 1 ? title + " – Page " + page + " – " : title + " – ") + "Printuz LTD";

    var baseHash = isSearch
      ? "#/search/" + searchHashToken() + "/page/"
      : categorySlug
        ? "#/category/" + encodeURIComponent(categorySlug) + "/page/"
        : "#/page/";

    var grid =
      slice.length === 0
        ? '<div class="empty-state">No products match your filters.</div>'
        : '<div class="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-4">' +
          slice.map(productCard).join("") +
          "</div>";

    return (
      shopTopBar(list.length, categorySlug, page, PER_PAGE, isSearch) +
      '<div class="row g-4">' +
      renderBrowseSidebar(isSearch ? null : categorySlug) +
      '<div class="col-lg-9">' +
      grid +
      pagination(page, totalPages, baseHash) +
      "</div></div>"
    );
  }

  function renderProduct(slug) {
    var p = productBySlug(slug);
    if (!p) {
      document.title = "Product not found – Printuz LTD";
      return (
        '<div class="empty-state">Product not found. <a href="#/category/' +
        DEFAULT_CATALOG_SLUG +
        '">Back to shop</a></div>'
      );
    }
    pushRecentlyViewed(p);
    document.title = p.name + " – Printuz LTD";

    var activeCat = productPrimaryCategory(p);
    var activeSlug = activeCat ? activeCat.slug : DEFAULT_CATALOG_SLUG;
    var images = getProductImages(p);
    if (!images.length && p.image) images = [fullImageUrl(p.image)];
    var mainSrc = images[0] || "";
    var thumbs = images
      .map(function (src, i) {
        return (
          '<button type="button" class="product-thumb-btn' +
          (i === 0 ? " is-active" : "") +
          '" data-src="' +
          esc(src) +
          '" aria-label="View image ' +
          (i + 1) +
          '">' +
          '<img src="' +
          esc(src) +
          '" alt="" loading="lazy">' +
          "</button>"
        );
      })
      .join("");

    var specs = getProductSpecs(p);
    var attrRows = specs
      .map(function (row) {
        return (
          '<tr><td class="attr-label">' +
          esc(row.label) +
          '</td><td class="attr-value">' +
          esc(row.value) +
          "</td></tr>"
        );
      })
      .join("");
    var attrTable =
      '<table class="product-attr-table"><tbody>' + attrRows + "</tbody></table>";

    var catLinks = (p.categoryIds || [])
      .map(function (cid) {
        var c = categoriesById()[cid];
        return c ? '<a href="#/category/' + esc(c.slug) + '">' + esc(c.label) + "</a>" : "";
      })
      .filter(Boolean)
      .join(", ");

    var longDesc = stripGalleryFromHtml(p.descriptionHtml || "");
    var longBlock = longDesc
      ? '<div class="product-long-desc">' + longDesc + "</div>"
      : "";

    var mainImgHtml = mainSrc
      ? '<img id="productMainImage" src="' +
        esc(mainSrc) +
        '" alt="' +
        esc(p.name) +
        '" data-gallery-index="0">'
      : '<div class="product-main-placeholder">No image</div>';

    var stageOpen =
      '<div class="product-gallery-stage">' +
      (images.length > 1
        ? '<button type="button" class="product-gallery-arrow prev" id="productGalleryPrev" aria-label="Previous image">&lsaquo;</button>'
        : "") +
      '<div class="product-main-image-wrap">' +
      mainImgHtml +
      (mainSrc
        ? '<button type="button" class="product-zoom-open" id="productZoomOpen" aria-label="Open image gallery">' +
          PRODUCT_ZOOM_ICON +
          "</button>"
        : "") +
      "</div>" +
      (images.length > 1
        ? '<button type="button" class="product-gallery-arrow next" id="productGalleryNext" aria-label="Next image">&rsaquo;</button>'
        : "") +
      "</div>";

    return (
      '<div class="product-detail-page">' +
      '<div class="row g-4">' +
      renderBrowseSidebar(activeSlug, { showPrice: false, contentFirst: true }) +
      '<div class="col-lg-9 order-1 order-lg-2">' +
      '<div class="product-detail-grid">' +
      '<div class="product-detail-gallery">' +
      stageOpen +
      (thumbs ? '<div class="product-thumb-row">' + thumbs + "</div>" : "") +
      "</div>" +
      '<div class="product-detail-summary">' +
      '<nav class="product-detail-bc" aria-label="Breadcrumb">' +
      productBreadcrumbHtml(p) +
      "</nav>" +
      "<h1 class=\"product-detail-title\">" +
      esc(p.name) +
      "</h1>" +
      '<div class="product-detail-price">' +
      esc(priceLabel(p)) +
      "</div>" +
      attrTable +
      '<a class="btn-start-order" href="' +
      esc(APP_LOGIN_URL) +
      '">Start new order</a>' +
      (catLinks
        ? '<p class="product-meta-cats"><strong>Categories:</strong> ' + catLinks + "</p>"
        : "") +
      "</div>" +
      '<div class="product-detail-tabs">' +
      '<div class="product-tab-list" role="tablist">' +
      '<button type="button" class="product-tab-btn is-active" data-tab="shipping" role="tab">Shipping</button>' +
      '<button type="button" class="product-tab-btn" data-tab="wholesale" role="tab">Wholesale</button>' +
      (longBlock
        ? '<button type="button" class="product-tab-btn" data-tab="description" role="tab">Description</button>'
        : "") +
      "</div>" +
      '<div class="product-tab-panel is-active" data-panel="shipping" role="tabpanel">' +
      "<h2>Shipping</h2>" +
      renderShippingTable() +
      "</div>" +
      '<div class="product-tab-panel" data-panel="wholesale" role="tabpanel">' +
      "<h2>Wholesale</h2>" +
      renderWholesaleTable(p) +
      "</div>" +
      (longBlock
        ? '<div class="product-tab-panel" data-panel="description" role="tabpanel">' +
          "<h2>Description</h2>" +
          longBlock +
          "</div>"
        : "") +
      "</div>" +
      renderRelatedCarousel(relatedProducts(p, 8)) +
      "</div></div></div></div>"
    );
  }

  function parseRoute() {
    var hash = window.location.hash || "#/page/1";
    var m;
    if ((m = hash.match(/^#\/product\/([^/]+)$/))) {
      return { view: "product", slug: decodeURIComponent(m[1]) };
    }
    if ((m = hash.match(/^#\/category\/([^/]+)\/page\/(\d+)$/))) {
      return { view: "catalog", category: decodeURIComponent(m[1]), page: parseInt(m[2], 10) };
    }
    if ((m = hash.match(/^#\/category\/([^/]+)$/))) {
      return { view: "catalog", category: decodeURIComponent(m[1]), page: 1 };
    }
    if ((m = hash.match(/^#\/page\/(\d+)$/))) {
      return { view: "catalog", category: null, page: parseInt(m[1], 10) };
    }
    if ((m = hash.match(/^#\/search\/([^/]+)\/page\/(\d+)$/))) {
      var q = decodeURIComponent(m[1]);
      if (q === "-") q = "";
      return { view: "search", q: q, page: parseInt(m[2], 10) };
    }
    if ((m = hash.match(/^#\/search\/([^/]+)$/))) {
      var q2 = decodeURIComponent(m[1]);
      if (q2 === "-") q2 = "";
      return { view: "search", q: q2, page: 1 };
    }
    return { view: "catalog", category: null, page: 1 };
  }

  function updatePriceLabel() {
    var minEl = document.getElementById("priceRangeMin");
    var maxEl = document.getElementById("priceRangeMax");
    var label = document.getElementById("priceFilterLabel");
    if (!minEl || !maxEl || !label) return;
    var a = parseInt(minEl.value, 10);
    var b = parseInt(maxEl.value, 10);
    if (a > b) {
      var t = a;
      a = b;
      b = t;
    }
    label.innerHTML = "Price: <strong>$" + a + " — $" + b + "</strong>";
  }

  function bindShopControls(categorySlug) {
    var sortEl = document.getElementById("shopSort");
    if (sortEl) {
      sortEl.value = state.sort;
      sortEl.onchange = function () {
        state.sort = sortEl.value;
        render();
      };
    }

    document.querySelectorAll(".browse-caret-btn").forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var slug = btn.getAttribute("data-browse");
        if (!slug) return;
        state.browseOpen[slug] = !state.browseOpen[slug];
        render();
      };
    });

    var minEl = document.getElementById("priceRangeMin");
    var maxEl = document.getElementById("priceRangeMax");
    if (minEl && maxEl) {
      var sync = function () {
        if (parseInt(minEl.value, 10) > parseInt(maxEl.value, 10)) {
          if (this === minEl) maxEl.value = minEl.value;
          else minEl.value = maxEl.value;
        }
        updatePriceLabel();
      };
      minEl.oninput = sync;
      maxEl.oninput = sync;
    }

    var filterBtn = document.getElementById("shopPriceFilter");
    if (filterBtn && minEl && maxEl) {
      filterBtn.onclick = function () {
        var lo = parseInt(minEl.value, 10);
        var hi = parseInt(maxEl.value, 10);
        if (lo > hi) {
          var t = lo;
          lo = hi;
          hi = t;
        }
        state.minPrice = lo > 0 ? lo * 100 : null;
        state.maxPrice = hi * 100;
        var route = parseRoute();
        if (route.view === "search") {
          location.hash = "#/search/" + searchHashToken() + "/page/1";
        } else if (route.category) {
          location.hash = "#/category/" + encodeURIComponent(route.category) + "/page/1";
        } else {
          location.hash = "#/page/1";
        }
        render();
      };
    }
  }

  function render() {
    var lb = document.getElementById("productLightbox");
    if (lb && lb.classList.contains("is-open")) {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      var lbImgEl = document.getElementById("productLightboxImg");
      if (lbImgEl) lbImgEl.classList.remove("is-zoomed");
    }

    var root = document.getElementById("app-root");
    if (!ready) {
      root.innerHTML = '<div class="post-loading">Loading catalog…</div>';
      return;
    }
    if (normalizeHash()) return;
    var route = parseRoute();
    if (route.view === "search") {
      state.q = route.q || "";
      if (state.sort === "default") state.sort = "relevance";
    } else if (route.view === "catalog") {
      state.q = "";
      if (state.sort === "relevance") state.sort = "default";
    }
    var html =
      route.view === "product"
        ? renderProduct(route.slug)
        : renderCatalog(route.page || 1, route.category, route.view === "search");
    root.innerHTML = html;
    if (route.view === "product") {
      bindProductDetail();
      var viewed = productBySlug(route.slug);
      var viewCat = viewed ? productPrimaryCategory(viewed) : null;
      bindShopControls(viewCat ? viewCat.slug : DEFAULT_CATALOG_SLUG);
    } else {
      bindShopControls(route.view === "search" ? null : route.category);
    }
    var searchInput = document.querySelector('.header-search input[type="search"]');
    if (searchInput && route.view !== "product") {
      searchInput.value = state.q || "";
    }
    var top = document.getElementById("top");
    if (top) top.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function loadData() {
    var root = document.getElementById("app-root");
    root.innerHTML = '<div class="post-loading">Loading products from Printuz…</div>';
    fetch("shop/meta.json")
      .then(function (r) {
        if (!r.ok) throw new Error("meta");
        return r.json();
      })
      .then(function (meta) {
        var v = meta && meta.syncedAt ? encodeURIComponent(meta.syncedAt) : "1";
        return Promise.all([
          Promise.resolve(meta),
          fetch("shop/products.json?v=" + v).then(function (r) {
            if (!r.ok) throw new Error("products");
            return r.json();
          }),
        ]);
      })
      .then(function (res) {
        PRODUCTS = res[1];
        CATEGORIES = res[0].categories || [];
        PER_PAGE = res[0].productsPerPage || 28;
        ready = true;
        render();
      })
      .catch(function (err) {
        root.innerHTML =
          '<div class="empty-state">Could not load shop data. Run local server and sync:<br>' +
          "<code>python scripts/sync_shop_from_printuz.py</code><br>" +
          esc(String(err)) +
          "</div>";
      });
  }

  document.addEventListener("keydown", function (e) {
    var lightbox = document.getElementById("productLightbox");
    if (!lightbox || !lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape" && lightbox._closeLightbox) lightbox._closeLightbox();
    if (e.key === "ArrowLeft" && lightbox._lightboxStep) lightbox._lightboxStep(-1);
    if (e.key === "ArrowRight" && lightbox._lightboxStep) lightbox._lightboxStep(1);
  });

  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", function () {
    loadData();
  });
})();
