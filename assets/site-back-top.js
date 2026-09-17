(function () {
  "use strict";

  var backTop = document.getElementById("backTop");
  if (!backTop) return;

  window.addEventListener(
    "scroll",
    function () {
      backTop.classList.toggle("visible", (window.scrollY || 0) > 400);
    },
    { passive: true }
  );

  backTop.addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
