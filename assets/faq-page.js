(function () {
  "use strict";

  function updateIcon(btn, open) {
    var icon = btn.querySelector(".faq-acc-icon");
    if (icon) icon.textContent = open ? "×" : "+";
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  document.querySelectorAll("[data-faq-acc]").forEach(function (item) {
    var btn = item.querySelector(".faq-acc-trigger");
    var panel = item.querySelector(".faq-acc-panel");
    if (!btn || !panel) return;

    updateIcon(btn, item.classList.contains("is-open"));

    btn.addEventListener("click", function () {
      var open = item.classList.contains("is-open");
      if (open) {
        item.classList.remove("is-open");
        panel.hidden = true;
        updateIcon(btn, false);
      } else {
        item.classList.add("is-open");
        panel.hidden = false;
        updateIcon(btn, true);
      }
    });

    if (!item.classList.contains("is-open")) panel.hidden = true;
  });

})();
