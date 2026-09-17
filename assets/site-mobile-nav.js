(function () {
  "use strict";

  var SEARCH_ICON =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>' +
    '<line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    "</svg>";

  function bindDrawerSearch(form) {
    if (window.PrintuzSearch && typeof PrintuzSearch.bindForm === "function") {
      PrintuzSearch.bindForm(form);
      return;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="search"]');
      var q = input ? input.value.trim() : "";
      var url =
        window.PrintuzSearch && PrintuzSearch.searchUrl
          ? PrintuzSearch.searchUrl(q)
          : "shop.html#/search/" + encodeURIComponent(q || "-") + "/page/1";
      location.href = url;
    });
  }

  function init() {
    var header = document.querySelector(".site-header .container");
    var nav = document.querySelector(".main-nav");
    if (!header || !nav || document.querySelector(".mobile-nav-toggle")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mobile-nav-toggle";
    btn.setAttribute("aria-label", "Open menu");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "mobileNavRoot");
    btn.innerHTML = "<span></span><span></span><span></span>";
    header.insertBefore(btn, header.firstChild);

    var root = document.createElement("div");
    root.id = "mobileNavRoot";
    root.className = "mobile-nav-root";
    root.innerHTML =
      '<div class="mobile-nav-overlay" data-close="1"></div>' +
      '<aside class="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Menu">' +
      '<form class="header-search" role="search">' +
      '<input class="form-control" type="search" placeholder="Search..." autocomplete="off">' +
      '<button class="btn" type="submit" aria-label="Search">' +
      SEARCH_ICON +
      "</button>" +
      "</form>" +
      '<nav class="mobile-nav-list"></nav>' +
      "</aside>" +
      '<button type="button" class="mobile-nav-close" aria-label="Close menu">&times;</button>';

    var list = root.querySelector(".mobile-nav-list");
    nav.querySelectorAll("a").forEach(function (a) {
      list.appendChild(a.cloneNode(true));
    });

    var login = document.querySelector(".site-header a.login-link");
    if (login) {
      var loginClone = login.cloneNode(true);
      loginClone.className = "login-link";
      list.appendChild(loginClone);
    }

    document.body.appendChild(root);

    var drawerSearch = root.querySelector(".header-search");
    bindDrawerSearch(drawerSearch);

    function openMenu() {
      root.classList.add("is-open");
      document.body.classList.add("mobile-nav-open");
      btn.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
      root.classList.remove("is-open");
      document.body.classList.remove("mobile-nav-open");
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", function () {
      if (root.classList.contains("is-open")) closeMenu();
      else openMenu();
    });

    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]") || e.target.closest(".mobile-nav-close")) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("is-open")) closeMenu();
    });

    list.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      if (a.classList.contains("login-link") && (a.getAttribute("href") || "") === "#login") {
        e.preventDefault();
        closeMenu();
        if (window.PrintuzAuth && PrintuzAuth.openLoginModal) {
          PrintuzAuth.openLoginModal();
        } else {
          location.href = "my-account.html";
        }
        return;
      }
      closeMenu();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
