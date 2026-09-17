(function () {
  "use strict";

  var INDEX = null;
  var INDEX_PROMISE = null;
  var DEBOUNCE = null;

  function shopBase() {
    var p = (location.pathname || "").replace(/\\/g, "/");
    if (/\/[^/]+\.html$/.test(p)) return p.replace(/[^/]+$/, "shop.html");
    if (p.endsWith("/")) return p + "shop.html";
    return "shop.html";
  }

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
    return "";
  }

  function searchUrl(q) {
    var base = shopBase();
    var token = q ? encodeURIComponent(q) : "-";
    return base + "#/search/" + token + "/page/1";
  }

  function productUrl(id) {
    return shopBase() + "#/product/" + encodeURIComponent(id);
  }

  function loadIndex() {
    if (INDEX) return Promise.resolve(INDEX);
    if (INDEX_PROMISE) return INDEX_PROMISE;
    var prefix = shopBase().replace(/shop\.html$/, "");
    INDEX_PROMISE = fetch(prefix + "shop/search-index.json")
      .then(function (r) {
        if (!r.ok) throw new Error("search-index");
        return r.json();
      })
      .then(function (data) {
        INDEX = data || [];
        return INDEX;
      })
      .catch(function () {
        INDEX = [];
        return INDEX;
      });
    return INDEX_PROMISE;
  }

  function scoreName(name, q) {
    var n = (name || "").toLowerCase();
    var query = q.toLowerCase();
    if (n === query) return 100;
    if (n.indexOf(query) === 0) return 80;
    if (n.indexOf(query) !== -1) return 60;
    return 0;
  }

  function matchProducts(q, limit) {
    if (!INDEX || !q) return [];
    var ranked = [];
    for (var i = 0; i < INDEX.length; i++) {
      var p = INDEX[i];
      var s = scoreName(p.name, q);
      if (s) ranked.push({ p: p, s: s });
    }
    ranked.sort(function (a, b) {
      return b.s - a.s || (a.p.name || "").localeCompare(b.p.name || "");
    });
    return ranked.slice(0, limit || 8).map(function (x) {
      return x.p;
    });
  }

  function ensurePanel(form) {
    var panel = form.querySelector(".live-search-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "live-search-panel";
      panel.setAttribute("role", "listbox");
      form.appendChild(panel);
    }
    return panel;
  }

  function closePanel(panel) {
    if (panel) panel.classList.remove("is-open");
  }

  function renderPanel(panel, list, q) {
    if (!q) {
      closePanel(panel);
      return;
    }
    if (!list.length) {
      panel.innerHTML = '<div class="live-search-empty">No products found.</div>';
      panel.classList.add("is-open");
      return;
    }
    panel.innerHTML = list
      .map(function (p) {
        var img = p.image
          ? '<img src="' + esc(p.image) + '" alt="" loading="lazy">'
          : "";
        return (
          '<a class="live-search-item" role="option" href="' +
          esc(productUrl(p.id)) +
          '">' +
          '<span class="live-search-thumb">' +
          img +
          "</span>" +
          '<span class="live-search-name">' +
          esc(p.name) +
          "</span>" +
          '<span class="live-search-price">' +
          esc(priceLabel(p)) +
          "</span>" +
          "</a>"
        );
      })
      .join("");
    panel.classList.add("is-open");
  }

  function bindForm(form) {
    if (!form || form.getAttribute("data-printuz-search-bound")) return;
    var input = form.querySelector('input[type="search"], input[name="s"]');
    if (!input) return;
    input.setAttribute("autocomplete", "off");
    var panel = ensurePanel(form);

    function goSearch() {
      var q = input.value.trim();
      location.href = searchUrl(q);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      closePanel(panel);
      goSearch();
    });

    var btn = form.querySelector('button[type="submit"], .ux-search-submit, [aria-label="Search"]');
    if (btn && btn.tagName === "BUTTON") {
      btn.addEventListener("click", function (e) {
        if (form.getAttribute("data-printuz-search-bound")) {
          e.preventDefault();
          closePanel(panel);
          goSearch();
        }
      });
    }

    input.addEventListener("input", function () {
      var q = input.value.trim();
      clearTimeout(DEBOUNCE);
      if (q.length < 2) {
        closePanel(panel);
        return;
      }
      DEBOUNCE = setTimeout(function () {
        loadIndex().then(function () {
          renderPanel(panel, matchProducts(q, 8), q);
        });
      }, 180);
    });

    input.addEventListener("focus", function () {
      var q = input.value.trim();
      if (q.length >= 2) {
        loadIndex().then(function () {
          renderPanel(panel, matchProducts(q, 8), q);
        });
      }
    });

    form.setAttribute("data-printuz-search-bound", "1");
  }

  var SEARCH_ICON_SVG =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>' +
    '<line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    "</svg>";

  function normalizeSearchButtons() {
    document.querySelectorAll('.header-search button[type="submit"]').forEach(function (btn) {
      var t = (btn.textContent || "").trim();
      if (!btn.querySelector("svg") && (t === "🔍" || t.indexOf("🔍") !== -1)) {
        btn.innerHTML = SEARCH_ICON_SVG;
        if (!btn.getAttribute("aria-label")) btn.setAttribute("aria-label", "Search");
      }
    });
  }

  function init() {
    normalizeSearchButtons();

    document.querySelectorAll(".header-search").forEach(bindForm);

    document.addEventListener("click", function (e) {
      if (e.target.closest(".header-search")) return;
      document.querySelectorAll(".live-search-panel.is-open").forEach(function (p) {
        p.classList.remove("is-open");
      });
    });
  }

  window.PrintuzSearch = {
    searchUrl: searchUrl,
    productUrl: productUrl,
    bindForm: bindForm,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
