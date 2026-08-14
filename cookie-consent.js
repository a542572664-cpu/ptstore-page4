(function () {
  "use strict";

  var STORAGE_KEY = "eiio_cookie_consent_v1";
  var CONSENT_VERSION = 1;
  var scriptElement = document.currentScript;
  var pixelId = scriptElement ? scriptElement.getAttribute("data-meta-pixel-id") : "";
  var marketingAllowed = false;
  var pixelInitialized = false;
  var pageViewSent = false;
  var lastFocusedElement = null;

  function readPreference() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (saved && saved.version === CONSENT_VERSION && typeof saved.marketing === "boolean") {
        return saved;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function savePreference(marketing) {
    var preference = {
      version: CONSENT_VERSION,
      necessary: true,
      marketing: Boolean(marketing),
      updatedAt: new Date().toISOString()
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    } catch (error) {
      /* The choice still applies for the current page if storage is unavailable. */
    }

    applyPreference(preference);
    closeConsentDialog();
  }

  function createMetaPixelQueue() {
    if (window.fbq) {
      return;
    }

    var fbq = window.fbq = function () {
      if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, arguments);
      } else {
        fbq.queue.push(arguments);
      }
    };

    if (!window._fbq) {
      window._fbq = fbq;
    }

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
  }

  function loadMetaPixel() {
    if (!marketingAllowed || !pixelId) {
      return;
    }

    if (pixelInitialized) {
      if (window.fbq) {
        window.fbq("consent", "grant");
      }
      return;
    }

    createMetaPixelQueue();
    window.fbq("consent", "grant");
    window.fbq("init", pixelId);
    pixelInitialized = true;

    if (!document.getElementById("meta-pixel-script")) {
      var metaScript = document.createElement("script");
      metaScript.id = "meta-pixel-script";
      metaScript.async = true;
      metaScript.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(metaScript);
    }

    if (!pageViewSent) {
      window.fbq("track", "PageView");
      pageViewSent = true;
    }
  }

  function applyPreference(preference) {
    marketingAllowed = Boolean(preference && preference.marketing);

    if (marketingAllowed) {
      loadMetaPixel();
    } else if (pixelInitialized && window.fbq) {
      window.fbq("consent", "revoke");
    }

    var toggle = document.getElementById("cookie-marketing");
    if (toggle) {
      toggle.checked = marketingAllowed;
    }
  }

  function showPanel(name) {
    document.querySelectorAll("[data-cookie-panel]").forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-cookie-panel") !== name;
    });
  }

  function openConsentDialog(panelName) {
    var dialog = document.getElementById("cookie-consent");
    if (!dialog) {
      return;
    }

    lastFocusedElement = document.activeElement;
    showPanel(panelName || "summary");
    dialog.hidden = false;

    var saved = readPreference();
    var toggle = document.getElementById("cookie-marketing");
    if (toggle) {
      toggle.checked = saved ? saved.marketing : false;
    }

    var focusTarget = dialog.querySelector("[data-cookie-panel]:not([hidden]) h2");
    if (focusTarget) {
      focusTarget.focus();
    }
  }

  function closeConsentDialog() {
    var dialog = document.getElementById("cookie-consent");
    if (!dialog) {
      return;
    }

    dialog.hidden = true;
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function renderConsentDialog() {
    var container = document.createElement("div");
    container.id = "cookie-consent";
    container.className = "cookie-consent";
    container.hidden = true;
    container.innerHTML = [
      '<div class="cookie-consent-card" role="dialog" aria-modal="true" aria-labelledby="cookie-summary-title">',
      '  <section class="cookie-consent-panel" data-cookie-panel="summary">',
      '    <h2 id="cookie-summary-title" tabindex="-1">Tu privacidad, tú decides</h2>',
      '    <p>Usamos almacenamiento local necesario para recordar tu elección. Meta Pixel solo se carga si aceptas las cookies de marketing. Puedes rechazar sin que las imágenes, la navegación o los botones de WhatsApp dejen de funcionar. Consulta nuestra <a href="cookies.html">Política de Cookies</a>.</p>',
      '    <div class="cookie-consent-actions">',
      '      <button class="cookie-consent-button" type="button" data-cookie-action="accept">Aceptar todas</button>',
      '      <button class="cookie-consent-button" type="button" data-cookie-action="reject">Rechazar todas</button>',
      '      <button class="cookie-consent-button" type="button" data-cookie-action="configure">Configurar</button>',
      '    </div>',
      '  </section>',
      '  <section class="cookie-consent-panel" data-cookie-panel="settings" hidden>',
      '    <h2 id="cookie-settings-title" tabindex="-1">Configuración de cookies</h2>',
      '    <p>Elige qué tecnologías opcionales permites. Las funciones necesarias permanecen activas para guardar tu preferencia.</p>',
      '    <div class="cookie-consent-options">',
      '      <label class="cookie-consent-option">',
      '        <span><strong>Necesarias</strong>Guardan tu elección y permiten el funcionamiento básico del sitio.</span>',
      '        <input class="cookie-consent-toggle" type="checkbox" checked disabled aria-label="Cookies necesarias, siempre activas">',
      '      </label>',
      '      <label class="cookie-consent-option" for="cookie-marketing">',
      '        <span><strong>Marketing</strong>Permiten cargar Meta Pixel para medición publicitaria y anuncios personalizados.</span>',
      '        <input class="cookie-consent-toggle" id="cookie-marketing" type="checkbox">',
      '      </label>',
      '    </div>',
      '    <p class="cookie-consent-note">Puedes cambiar esta elección en cualquier momento desde “Configuración de cookies” en el pie de página.</p>',
      '    <div class="cookie-consent-actions">',
      '      <button class="cookie-consent-button" type="button" data-cookie-action="save">Guardar preferencias</button>',
      '      <button class="cookie-consent-button" type="button" data-cookie-action="reject">Rechazar todas</button>',
      '      <button class="cookie-consent-button" type="button" data-cookie-action="accept">Aceptar todas</button>',
      '    </div>',
      '    <button class="cookie-consent-button" type="button" data-cookie-action="close" style="width:100%;margin-top:10px">Volver</button>',
      '  </section>',
      '</div>'
    ].join("");

    document.body.appendChild(container);

    container.addEventListener("click", function (event) {
      var actionElement = event.target.closest("[data-cookie-action]");
      if (!actionElement) {
        return;
      }

      var action = actionElement.getAttribute("data-cookie-action");
      if (action === "accept") {
        savePreference(true);
      } else if (action === "reject") {
        savePreference(false);
      } else if (action === "configure") {
        showPanel("settings");
        document.getElementById("cookie-settings-title").focus();
      } else if (action === "save") {
        savePreference(document.getElementById("cookie-marketing").checked);
      } else if (action === "close") {
        if (readPreference()) {
          closeConsentDialog();
        } else {
          showPanel("summary");
          document.getElementById("cookie-summary-title").focus();
        }
      }
    });

    document.addEventListener("click", function (event) {
      var settingsLink = event.target.closest("[data-cookie-settings]");
      if (!settingsLink) {
        return;
      }
      event.preventDefault();
      openConsentDialog("settings");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !container.hidden && readPreference()) {
        closeConsentDialog();
      }
    });
  }

  window.eiioTrackMetaEvent = function (eventName, parameters) {
    if (!marketingAllowed || !pixelInitialized || !window.fbq) {
      return false;
    }
    window.fbq("track", eventName, parameters || {});
    return true;
  };

  document.addEventListener("click", function (event) {
    var whatsappLink = event.target.closest([
      'a[href*="wa.me/"]',
      'a[href*="api.whatsapp.com/"]',
      'a[href*="web.whatsapp.com/"]'
    ].join(", "));

    if (whatsappLink && marketingAllowed && pixelInitialized && window.fbq) {
      window.fbq("track", "Contact");
    }
  });

  function initializeConsent() {
    renderConsentDialog();
    var preference = readPreference();
    if (preference) {
      applyPreference(preference);
    } else {
      applyPreference({ marketing: false });
      openConsentDialog("summary");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeConsent);
  } else {
    initializeConsent();
  }
}());
