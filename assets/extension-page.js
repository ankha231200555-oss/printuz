(function () {
  "use strict";

  var POST_ID = "cach-syns-product-va-order-tu-cac-san-khac-ve-printuz-bang-extension";
  var HERO_SRC = "assets/extension/00-featured-hero.png";
  var mount = document.getElementById("post-root");
  if (!mount) return;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function featuredHero(p) {
    var day = p.dateDay || "07";
    var mon = (p.dateMon || "NOV").toLowerCase();
    if (mon.length > 3) mon = mon.slice(0, 3);
    return (
      '<div class="featured-with-date">' +
      '<div class="date-ribbon"><span class="day">' +
      esc(day) +
      '</span><span class="mon">' +
      esc(mon) +
      "</span></div>" +
      '<img src="' +
      esc(HERO_SRC) +
      '" alt="" loading="eager" decoding="async">' +
      "</div>"
    );
  }

  function renderShell(p, authors, posts, idx, bodyHtml) {
    var author = authors[p.authorSlug] || { name: p.authorSlug };
    var authorDisplay = (author.name || p.authorSlug).toUpperCase();
    document.title = p.title + " – Printuz LTD";
    var catHref = "news.html#/category/" + encodeURIComponent(p.categorySlug || "printuz-guide");
    var shareUrl = window.location.href.split("#")[0];

    var older = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null;
    var newer = idx > 0 ? posts[idx - 1] : null;
    var leftNav = older
      ? '<a href="news.html#/post/' +
        encodeURIComponent(older.id) +
        '">&lt; ' +
        esc(older.title) +
        "</a>"
      : '<span class="empty">&nbsp;</span>';
    var rightNav = newer
      ? '<a href="news.html#/post/' +
        encodeURIComponent(newer.id) +
        '">' +
        esc(newer.title) +
        " &gt;</a>"
      : '<span class="empty">&nbsp;</span>';

    var ICON_FB =
      '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>';
    var ICON_TW =
      '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>';
    var ICON_EM =
      '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M22 6l-10 7L2 6"></path></svg>';

    mount.innerHTML =
      '<article class="post-shell ext-post-shell">' +
      '<a href="' +
      catHref +
      '" class="post-eyebrow">' +
      esc((p.categoryLabel || "Printuz Guide").toUpperCase()) +
      "</a>" +
      '<h1 class="post-title">' +
      esc(p.title) +
      "</h1>" +
      '<div class="post-meta-line">' +
      "<span>Posted on " +
      esc(p.date) +
      "</span>" +
      '<span class="sep">|</span>' +
      "<span>by " +
      '<a href="news.html#/author/' +
      encodeURIComponent(p.authorSlug) +
      '">' +
      esc(authorDisplay) +
      "</a></span>" +
      "</div>" +
      featuredHero(p) +
      '<div class="post-body ext-wp-body">' +
      bodyHtml +
      "</div>" +
      '<div class="share-row">' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' +
      encodeURIComponent(shareUrl) +
      '" class="share-btn fb" target="_blank" rel="noopener">' +
      ICON_FB +
      "</a>" +
      '<a href="https://twitter.com/intent/tweet?url=' +
      encodeURIComponent(shareUrl) +
      "&text=" +
      encodeURIComponent(p.title) +
      '" class="share-btn tw" target="_blank" rel="noopener">' +
      ICON_TW +
      "</a>" +
      '<a href="mailto:?subject=' +
      encodeURIComponent(p.title) +
      "&body=" +
      encodeURIComponent(shareUrl) +
      '" class="share-btn em">' +
      ICON_EM +
      "</a>" +
      '<a href="https://pinterest.com/pin/create/button/?url=' +
      encodeURIComponent(shareUrl) +
      '" class="share-btn pin" target="_blank" rel="noopener"><span class="glyph">P</span></a>' +
      '<a href="https://www.linkedin.com/sharing/share-offsite/?url=' +
      encodeURIComponent(shareUrl) +
      '" class="share-btn li" target="_blank" rel="noopener"><span class="glyph">in</span></a>' +
      "</div>" +
      '<p class="entry-footer-note">This entry was posted in <a href="' +
      catHref +
      '">' +
      esc(p.categoryLabel || "Printuz Guide") +
      '</a>. Bookmark the <a href="' +
      shareUrl +
      '">permalink</a>.</p>' +
      '<div class="author-name-block"><a href="news.html#/author/' +
      encodeURIComponent(p.authorSlug) +
      '">' +
      esc(authorDisplay) +
      "</a></div>" +
      '<div class="post-nav-wp"><div>' +
      leftNav +
      '</div><div class="next-cell">' +
      rightNav +
      "</div></div></article>";
  }

  mount.innerHTML = '<div class="post-loading">Đang tải hướng dẫn Extension…</div>';

  Promise.all([
    fetch("blog/posts.json").then(function (r) {
      return r.json();
    }),
    fetch("blog/meta.json").then(function (r) {
      return r.json();
    }),
    fetch("assets/extension-body.html").then(function (r) {
      return r.text();
    }),
  ])
    .then(function (triple) {
      var posts = triple[0];
      var meta = triple[1];
      var bodyHtml = triple[2];
      var p = null;
      var idx = -1;
      for (var i = 0; i < posts.length; i++) {
        if (posts[i].id === POST_ID) {
          p = posts[i];
          idx = i;
          break;
        }
      }
      if (!p) {
        mount.innerHTML = '<div class="post-shell"><p>Không tìm thấy bài hướng dẫn.</p></div>';
        return;
      }
      renderShell(p, meta.authors || {}, posts, idx, bodyHtml);
    })
    .catch(function () {
      mount.innerHTML =
        '<div class="post-shell"><p>Không tải được dữ liệu. Mở trang qua http://localhost:8080/extension.html</p></div>';
    });

  var backTop = document.getElementById("backTop");
  if (backTop) {
    window.addEventListener(
      "scroll",
      function () {
        if ((window.scrollY || 0) > 400) backTop.classList.add("visible");
        else backTop.classList.remove("visible");
      },
      { passive: true }
    );
    backTop.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
