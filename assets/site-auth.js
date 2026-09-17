(function () {
  "use strict";

  var APP_URL = "https://app.printuz.com";

  function path() {
    return (location.pathname || "").replace(/\\/g, "/").toLowerCase();
  }

  function isAccountPage() {
    return /(?:^|\/)(my-account|reset-password)\.html$/.test(path());
  }

  function isResetPage() {
    return /(?:^|\/)reset-password\.html$/.test(path());
  }

  function isLoginPage() {
    return /(?:^|\/)my-account\.html$/.test(path());
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function validIdentifier(v) {
    v = (v || "").trim();
    if (!v) return false;
    if (v.indexOf("@") !== -1) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }
    return v.length >= 2;
  }

  function showNotice(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-visible");
  }

  function hideNotice(el) {
    if (!el) return;
    el.classList.remove("is-visible");
    el.textContent = "";
  }

  function wireAppLoginLinks() {
    document.querySelectorAll('.main-nav a[href="#app"]').forEach(function (a) {
      a.href = APP_URL;
      a.removeAttribute("target");
      a.removeAttribute("rel");
    });
  }

  function ensureModal() {
    var overlay = document.getElementById("printuzAuthModal");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "printuzAuthModal";
    overlay.className = "auth-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "authModalTitle");
    overlay.innerHTML =
      '<button type="button" class="auth-modal-close" aria-label="Close">&times;</button>' +
      '<div class="auth-modal-panel">' +
      '<h2 class="auth-form-title" id="authModalTitle">LOGIN</h2>' +
      '<div class="woo-notice-bar" id="authModalNotice" role="alert"></div>' +
      '<form id="authModalForm" class="auth-form-block" novalidate>' +
      '<div class="auth-field">' +
      '<label for="authModalUser">Username or email address <span class="req">*</span></label>' +
      '<input id="authModalUser" name="username" type="text" autocomplete="username">' +
      "</div>" +
      '<div class="auth-field">' +
      '<label for="authModalPass">Password <span class="req">*</span></label>' +
      '<input id="authModalPass" name="password" type="password" autocomplete="current-password">' +
      "</div>" +
      '<label class="auth-remember">' +
      '<input type="checkbox" name="remember" value="1"> Remember me' +
      "</label>" +
      '<button type="submit" class="btn-auth-submit">LOG IN</button>' +
      "</form>" +
      '<a class="auth-secondary-link" href="reset-password.html">Lost your password?</a>' +
      "</div>";

    document.body.appendChild(overlay);

    overlay.querySelector(".auth-modal-close").addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });

    document.getElementById("authModalForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var notice = document.getElementById("authModalNotice");
      hideNotice(notice);
      var user = document.getElementById("authModalUser").value;
      var pass = document.getElementById("authModalPass").value;
      if (!user.trim()) {
        showNotice(notice, "Error: Username is required.");
        return;
      }
      if (!pass) {
        showNotice(notice, "Error: Password is required.");
        return;
      }
      hideNotice(notice);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) closeModal();
    });

    return overlay;
  }

  function openModal() {
    if (isAccountPage()) {
      location.href = "my-account.html";
      return;
    }
    var overlay = ensureModal();
    hideNotice(document.getElementById("authModalNotice"));
    overlay.classList.add("is-open");
    document.body.classList.add("auth-modal-open");
    var user = document.getElementById("authModalUser");
    if (user) user.focus();
  }

  function closeModal() {
    var overlay = document.getElementById("printuzAuthModal");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("auth-modal-open");
    if (location.hash === "#login") {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  function bindHeaderLogin() {
    document.querySelectorAll('a.login-link[href="#login"], a[href="#login"].login-link').forEach(function (a) {
      if (isLoginPage()) {
        a.setAttribute("href", "my-account.html");
        return;
      }
      if (isResetPage()) {
        a.setAttribute("href", "my-account.html");
        return;
      }
      a.addEventListener("click", function (e) {
        e.preventDefault();
        openModal();
      });
    });

    if (location.hash === "#login" && !isAccountPage()) {
      openModal();
    }
  }

  function bindPageForms() {
    var resetForm = document.getElementById("resetPasswordForm");
    if (resetForm) {
      var resetNotice = document.getElementById("accountPageNotice");
      resetForm.addEventListener("submit", function (e) {
        e.preventDefault();
        hideNotice(resetNotice);
        var id = resetForm.querySelector('[name="user_login"]');
        var val = id ? id.value : "";
        if (!validIdentifier(val)) {
          showNotice(resetNotice, "Invalid username or email.");
          return;
        }
        hideNotice(resetNotice);
      });
    }

    var loginForm = document.getElementById("accountLoginForm");
    if (loginForm) {
      var loginNotice = document.getElementById("accountPageNotice");
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        hideNotice(loginNotice);
        var userEl = loginForm.querySelector('[name="username"]');
        var passEl = loginForm.querySelector('[name="password"]');
        var user = userEl ? userEl.value : "";
        var pass = passEl ? passEl.value : "";
        if (!user.trim()) {
          showNotice(loginNotice, "Error: Username is required.");
          return;
        }
        if (!pass) {
          showNotice(loginNotice, "Error: Password is required.");
          return;
        }
        hideNotice(loginNotice);
      });
    }
  }

  function init() {
    wireAppLoginLinks();
    bindHeaderLogin();
    if (!isAccountPage()) ensureModal();
    bindPageForms();
  }

  window.PrintuzAuth = { openLoginModal: openModal, closeLoginModal: closeModal };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
