(function () {
  "use strict";

  const LOGO = "logo_mello_informatica.jpg";

  function applyAuthBrand() {
    const brand = document.querySelector(".auth-brand");
    if (!brand || brand.querySelector(".auth-logo")) return;
    brand.innerHTML = `<img class="auth-logo" src="${LOGO}" alt="Mello Informática">`;
  }

  new MutationObserver(applyAuthBrand).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  function enhancePdfWindow(pdfWindow) {
    if (!pdfWindow) return;
    const apply = () => {
      try {
        const doc = pdfWindow.document;
        const header = doc.querySelector("header > div");
        if (header && !header.querySelector(".logo")) {
          const logo = doc.createElement("img");
          logo.className = "logo";
          logo.src = LOGO;
          logo.alt = "Mello Informática";
          header.prepend(logo);
        }
        const back = doc.querySelector(".docbar .back");
        if (back) {
          back.onclick = () => {
            if (pdfWindow.opener && !pdfWindow.opener.closed) {
              pdfWindow.opener.focus();
              pdfWindow.close();
            } else {
              pdfWindow.location.replace("index.html");
            }
          };
        }
      } catch (_) {
        // A impressão continua disponível mesmo se o navegador bloquear ajustes.
      }
    };
    setTimeout(apply, 80);
    setTimeout(apply, 450);
  }

  if (window.Mello?.PDF) {
    Object.keys(window.Mello.PDF).forEach(name => {
      const original = window.Mello.PDF[name];
      window.Mello.PDF[name] = (...args) => {
        const nativeOpen = window.open;
        let pdfWindow = null;
        window.open = (...openArgs) => {
          pdfWindow = nativeOpen(...openArgs);
          return pdfWindow;
        };
        try {
          return original(...args);
        } finally {
          window.open = nativeOpen;
          enhancePdfWindow(pdfWindow);
        }
      };
    });
  }
})();
