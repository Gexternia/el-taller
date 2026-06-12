(function () {
  document.body.classList.add("js");

  var ENSAYO = new URLSearchParams(location.search).get("ensayo") === "1";
  var APP_RE = /^\s*(<!doctype\s+html|<html[\s>])/i;

  var state = {
    mode: "web",
    sector: "hotel",
    busy: false,
    raw: "",
    kind: null,
    docType: "Documento",
    model: "claude-fable-5",
    seconds: 0,
    pinned: false,
    brand: null,
    styleBrand: null,
    dataNote: null
  };

  var els = {
    badge: document.getElementById("ensayo-badge"),
    modes: Array.prototype.slice.call(document.querySelectorAll(".mode")),
    panels: {
      web: document.getElementById("panel-web"),
      datos: document.getElementById("panel-datos"),
      libre: document.getElementById("panel-libre")
    },
    sectors: Array.prototype.slice.call(document.querySelectorAll(".sector")),
    sectorHint: document.getElementById("sector-hint"),
    inputUrl: document.getElementById("input-url"),
    inputDatos: document.getElementById("input-datos"),
    inputLibre: document.getElementById("input-libre"),
    inputStyleUrl: document.getElementById("input-style-url"),
    dataFileBtn: document.getElementById("data-file-btn"),
    dataFile: document.getElementById("data-file"),
    dataChip: document.getElementById("data-chip"),
    styleChip: document.getElementById("style-chip"),
    makeBtn: document.getElementById("make-btn"),
    bench: document.getElementById("bench"),
    statusText: document.getElementById("status-text"),
    statusTimer: document.getElementById("status-timer"),
    errorCard: document.getElementById("error-card"),
    errorText: document.getElementById("error-text"),
    retryBtn: document.getElementById("retry-btn"),
    paper: document.getElementById("paper"),
    paperType: document.getElementById("paper-type"),
    paperNum: document.getElementById("paper-num"),
    paperLogo: document.getElementById("paper-logo"),
    paperBody: document.getElementById("paper-body"),
    paperMeta: document.getElementById("paper-meta"),
    benchActions: document.getElementById("bench-actions"),
    pinBtn: document.getElementById("pin-btn"),
    downloadBtn: document.getElementById("download-btn"),
    againBtn: document.getElementById("again-btn"),
    modalDownload: document.getElementById("modal-download"),
    scrollProgress: document.getElementById("scroll-progress"),
    wallN: document.getElementById("wall-n"),
    wallGrid: document.getElementById("wall-grid"),
    modal: document.getElementById("modal"),
    modalBackdrop: document.getElementById("modal-backdrop"),
    modalClose: document.getElementById("modal-close"),
    modalPaper: document.getElementById("modal-paper"),
    modalType: document.getElementById("modal-type"),
    modalNum: document.getElementById("modal-num"),
    modalLogo: document.getElementById("modal-logo"),
    modalBody: document.getElementById("modal-body"),
    modalMeta: document.getElementById("modal-meta")
  };

  var SECTOR_LABELS = {
    hotel: "Hotel",
    movilidad: "Movilidad",
    agencia: "Agencia · TMC",
    empresa: "Empresa"
  };

  var SECTOR_HINTS = {
    hotel: "Entregable: one-pager comercial para captar cuentas corporativas, vestido con tu marca.",
    movilidad: "Entregable: propuesta de programa corporativo para un cliente tipo, vestida con tu marca.",
    agencia: "Entregable: documento de posicionamiento y a qué cuenta atacar, vestido con tu marca.",
    empresa: "Entregable: diagnóstico exprés del programa de viajes con tres recomendaciones."
  };

  var ENSAYO_INPUTS = {
    web: "atticahotels.example.com",
    datos: "mes,gasto_aereo,gasto_hotel,reservas\nenero,21400,11200,38\nfebrero,19800,10900,35\nmarzo,26900,12400,41\nabril,31200,13100,44",
    libre: "Una política de viajes de una página para una pyme de 40 empleados con oficinas en A Coruña y Madrid."
  };

  var ENSAYO_DOCS = {
    web: { docType: "One-pager comercial", html: "<h3>Attica Hoteles · Programa Corporate A Coruña</h3><p><em>Elaborado a partir de información pública básica.</em></p><p>Cadena hotelera urbana con presencia en Galicia y enfoque en el viajero de empresa: ubicaciones céntricas, salas de reunión y restauración propia.</p><h4>Propuesta para cuentas corporativas</h4><ul><li>Tarifa corporativa fija anual con desayuno y wifi incluidos.</li><li>Cancelación flexible hasta el día de llegada.</li><li>Facturación centralizada mensual con desglose por centro de coste.</li><li>Interlocutor único para el travel manager.</li></ul><h4>Condiciones</h4><table><thead><tr><th>Concepto</th><th>Condición</th></tr></thead><tbody><tr><td>Tarifa LRA</td><td>[completar] € · doble uso individual</td></tr><tr><td>Volumen mínimo</td><td>[completar] noches al año</td></tr><tr><td>Revisión</td><td>Anual con histórico de producción</td></tr></tbody></table><p>Contacto comercial: [completar]. Validez: 30 días.</p>" },
    datos: { docType: "Informe ejecutivo", html: "<h3>Informe ejecutivo · Gasto de viaje enero–abril</h3><h4>La foto</h4><p>El gasto acumulado del cuatrimestre asciende a 147.700 €: 99.300 € de aéreo y 47.600 € de hotel, con 158 reservas. El gasto medio por reserva sube de 858 € en enero a 1.007 € en abril.</p><h4>La desviación que importa</h4><p>El aéreo de abril (31.200 €) crece un 46 % sobre enero con solo un 16 % más de reservas: el precio medio por billete se ha disparado. El hotel se mantiene estable.</p><h4>La acción recomendada</h4><ul><li>Auditar la antelación de compra de los billetes de marzo y abril antes de renegociar tarifas.</li><li>Fijar un techo de tarifa aérea por trayecto recurrente y alertar las compras que lo superen.</li><li>Mantener el programa hotelero tal cual: no es la fuga.</li></ul><blockquote>La fuga no está en las tarifas: está en cuándo se compra.</blockquote>" },
    libre: { docType: "Encargo libre", html: "<h3>Política de viajes · Pyme de 40 empleados</h3><p>Vigencia: a partir del 1 de julio de 2026. Aplica a todos los empleados que viajen por cuenta de la empresa desde las oficinas de A Coruña y Madrid.</p><h4>Tres reglas</h4><ul><li>Reserva con un mínimo de 10 días de antelación por el canal corporativo. Excepciones: aprobación del responsable directo.</li><li>Techo por noche de hotel: 110 € en Madrid y Barcelona, 85 € en el resto de España. Internacional: [completar].</li><li>Clase turista en vuelos de menos de 5 horas. Tren antes que avión cuando el trayecto sea inferior a 3 horas.</li></ul><h4>Aprobaciones</h4><table><thead><tr><th>Caso</th><th>Quién aprueba</th></tr></thead><tbody><tr><td>Nacional dentro de política</td><td>Automática</td></tr><tr><td>Internacional</td><td>Responsable de área</td></tr><tr><td>Fuera de política</td><td>Dirección</td></tr></tbody></table><p>Los gastos se liquidan en los 5 días siguientes al regreso, con justificante digital.</p>" }
  };

  var timerHandle = null;
  var timerStart = 0;
  var renderQueued = false;
  var codeEl = null;

  function fmtSeconds(s) {
    return s.toFixed(1).replace(".", ",") + " s";
  }

  function startTimer() {
    timerStart = performance.now();
    stopTimer();
    timerHandle = setInterval(function () {
      var s = (performance.now() - timerStart) / 1000;
      els.statusTimer.textContent = fmtSeconds(s);
    }, 100);
  }

  function stopTimer() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  function setStatus(text) {
    els.statusText.textContent = text;
  }

  function cleanRaw(raw) {
    return raw.replace(/^\s*```(?:html)?\s*/i, "").replace(/```\s*$/, "");
  }

  function darkenIfLight(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    if (lum <= 0.62) return hex;
    var f = 0.55 / lum;
    var to2 = function (n) {
      return Math.max(0, Math.min(255, Math.round(n * f))).toString(16).padStart(2, "0");
    };
    return "#" + to2(r) + to2(g) + to2(b);
  }

  function loadBrandFonts(fonts) {
    if (!fonts || !fonts.length) return;
    var fams = fonts
      .map(function (f) {
        return "family=" + encodeURIComponent(f).replace(/%20/g, "+") + ":wght@400;600;700";
      })
      .join("&");
    var href = "https://fonts.googleapis.com/css2?" + fams + "&display=swap";
    if (!document.querySelector('link[data-brandfont="' + href + '"]')) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-brandfont", href);
      document.head.appendChild(link);
    }
  }

  function applyBrand(paperEl, logoEl, brand) {
    paperEl.style.removeProperty("--doc-accent");
    paperEl.style.removeProperty("--doc-display");
    paperEl.style.removeProperty("--doc-body");
    logoEl.hidden = true;
    logoEl.removeAttribute("src");
    if (!brand) return;
    if (brand.color) paperEl.style.setProperty("--doc-accent", darkenIfLight(brand.color));
    if (brand.fonts && brand.fonts.length) {
      loadBrandFonts(brand.fonts);
      paperEl.style.setProperty("--doc-display", '"' + brand.fonts[0] + '", "Space Grotesk", sans-serif');
      paperEl.style.setProperty("--doc-body", '"' + (brand.fonts[1] || brand.fonts[0]) + '", "Work Sans", sans-serif');
    }
    if (brand.logo) {
      logoEl.onerror = function () {
        logoEl.hidden = true;
      };
      logoEl.src = brand.logo;
      logoEl.hidden = false;
    }
  }

  function currentBrand() {
    return state.styleBrand || state.brand || null;
  }

  function brandProfileText(brand) {
    if (!brand) return null;
    var bits = [];
    if (brand.color) bits.push("color principal " + brand.color);
    if (brand.fonts && brand.fonts.length) bits.push("tipografías " + brand.fonts.join(" y "));
    if (brand.logo) bits.push("logo disponible");
    return bits.length ? bits.join("; ") : null;
  }

  var PDF_SRC = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js";
  var pdfLibPromise = null;

  function ensurePdfLib() {
    if (window.html2pdf) return Promise.resolve();
    if (pdfLibPromise) return pdfLibPromise;
    pdfLibPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = PDF_SRC;
      script.onload = function () { resolve(); };
      script.onerror = function () {
        pdfLibPromise = null;
        reject(new Error("cdn"));
      };
      document.head.appendChild(script);
      setTimeout(function () {
        if (!window.html2pdf) {
          pdfLibPromise = null;
          reject(new Error("timeout"));
        }
      }, 9000);
    });
    return pdfLibPromise;
  }

  function slugify(text) {
    var slug = String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
    return slug || "entregable";
  }

  function buildPdfNode(docType, html, brand, meta) {
    var node = document.createElement("article");
    node.className = "paper pdf-paper";
    if (brand && brand.color) node.style.setProperty("--doc-accent", darkenIfLight(brand.color));
    if (brand && brand.fonts && brand.fonts.length) {
      loadBrandFonts(brand.fonts);
      node.style.setProperty("--doc-display", '"' + brand.fonts[0] + '", "Space Grotesk", sans-serif');
      node.style.setProperty("--doc-body", '"' + (brand.fonts[1] || brand.fonts[0]) + '", "Work Sans", sans-serif');
    }
    var head = document.createElement("header");
    head.className = "paper-head";
    var type = document.createElement("span");
    type.className = "paper-type";
    type.textContent = docType;
    head.appendChild(type);
    if (brand && brand.logo) {
      var img = document.createElement("img");
      img.className = "paper-logo";
      img.crossOrigin = "anonymous";
      img.src = brand.logo;
      head.appendChild(img);
    }
    var body = document.createElement("div");
    body.className = "paper-body";
    body.innerHTML = html;
    var foot = document.createElement("footer");
    foot.className = "paper-foot";
    var stamp = document.createElement("span");
    stamp.className = "paper-stamp";
    stamp.textContent = "Generado en vivo · Jornada AEGVE A Coruña · Externia";
    var metaEl = document.createElement("span");
    metaEl.className = "paper-meta";
    metaEl.textContent = meta || "";
    foot.appendChild(stamp);
    foot.appendChild(metaEl);
    node.appendChild(head);
    node.appendChild(body);
    node.appendChild(foot);
    return node;
  }

  function printFallback(docType, html, brand, meta, title) {
    var accent = brand && brand.color ? darkenIfLight(brand.color) : "#1B1B1F";
    var win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      "<!doctype html><html><head><meta charset=\"utf-8\"><title>" + (title || docType) + "</title><style>" +
      "body{font-family:Segoe UI,Arial,sans-serif;color:#1B1B1F;max-width:720px;margin:0 auto;padding:40px 24px;line-height:1.6;font-size:14px}" +
      ".tp{font-family:Consolas,monospace;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:" + accent + ";border-bottom:3px solid " + accent + ";padding-bottom:12px;margin-bottom:24px}" +
      "h3{font-size:24px;line-height:1.2;margin:0 0 14px}h4{font-family:Consolas,monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:" + accent + ";margin:22px 0 8px}" +
      "table{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0 18px}th{font-family:Consolas,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;text-align:left;padding:7px 10px 7px 0;border-bottom:2px solid " + accent + "}td{padding:8px 10px 8px 0;border-bottom:1px solid #1B1B1F22;vertical-align:top}" +
      "blockquote{margin:20px 0;padding:12px 18px;border-left:3px solid " + accent + ";background:#1B1B1F0b;font-weight:600}" +
      ".st{margin-top:32px;padding-top:14px;border-top:1px solid #1B1B1F29;font-family:Consolas,monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#6E6E76}" +
      "</style></head><body><div class=\"tp\">" + docType + "</div>" + html +
      "<p class=\"st\">Generado en vivo · Jornada AEGVE A Coruña · Externia" + (meta ? " · " + meta : "") + "</p></body></html>"
    );
    win.document.close();
    win.focus();
    setTimeout(function () { win.print(); }, 500);
  }

  async function downloadPdf(docType, html, brand, title, meta) {
    var node = buildPdfNode(docType, html, brand, meta);
    try {
      await ensurePdfLib();
      if (document.fonts && document.fonts.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise(function (resolve) { setTimeout(resolve, 2500); })
        ]);
      }
      await window
        .html2pdf()
        .set({
          margin: [12, 12, 14, 12],
          filename: slugify(title) + ".pdf",
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#FBFAF7", logging: false, windowWidth: 794 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"], avoid: ["table", "blockquote", "h4", "tr"] }
        })
        .from(node)
        .save();
    } catch (e) {
      printFallback(docType, html, brand, meta, title);
    }
  }

  function downloadAppHtml(title, html) {
    var blob = new Blob([html], { type: "text/html;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = slugify(title) + ".html";
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 600);
  }

  async function handleDownload(btn, item) {
    if (btn.disabled) return;
    var original = btn.textContent;
    btn.disabled = true;
    if (item.kind === "app") {
      downloadAppHtml(item.title, item.html);
      btn.disabled = false;
      return;
    }
    btn.textContent = "Preparando PDF";
    try {
      await downloadPdf(item.docType, item.html, item.brand, item.title, item.meta);
    } finally {
      btn.textContent = original;
      btn.disabled = false;
    }
  }

  function ensureCodeEl() {
    if (!codeEl) {
      codeEl = document.createElement("pre");
      codeEl.className = "code-stream";
    }
    if (!codeEl.parentNode) {
      els.paperBody.innerHTML = "";
      els.paperBody.appendChild(codeEl);
    }
    return codeEl;
  }

  function buildAppFrame(html) {
    var frame = document.createElement("iframe");
    frame.className = "app-frame";
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("srcdoc", html);
    return frame;
  }

  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(function () {
      renderQueued = false;
      var cleaned = cleanRaw(state.raw);
      if (state.kind === null && cleaned.length > 40) {
        state.kind = APP_RE.test(cleaned) ? "app" : "doc";
        if (state.kind === "app") {
          els.paperType.textContent = "Aplicación en vivo";
          setStatus("El agente está programando");
        }
      }
      if (state.kind === "app") {
        var el = ensureCodeEl();
        el.textContent = cleaned.length > 5000 ? cleaned.slice(cleaned.length - 5000) : cleaned;
        el.scrollTop = el.scrollHeight;
      } else {
        els.paperBody.innerHTML = cleaned;
      }
    });
  }

  function selectMode(mode) {
    state.mode = mode;
    els.modes.forEach(function (btn) {
      var on = btn.dataset.mode === mode;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    Object.keys(els.panels).forEach(function (key) {
      els.panels[key].hidden = key !== mode;
    });
  }

  function selectSector(sector) {
    state.sector = sector;
    els.sectors.forEach(function (btn) {
      var on = btn.dataset.sector === sector;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    els.sectorHint.textContent = SECTOR_HINTS[sector];
  }

  function resetBench() {
    els.errorCard.hidden = true;
    els.paper.hidden = true;
    els.benchActions.hidden = true;
    els.bench.classList.remove("is-done");
    els.paper.classList.remove("is-app");
    els.paperBody.innerHTML = "";
    els.paperMeta.textContent = "";
    els.statusTimer.textContent = "0,0 s";
    applyBrand(els.paper, els.paperLogo, null);
    if (codeEl && codeEl.parentNode) codeEl.parentNode.removeChild(codeEl);
    state.raw = "";
    state.kind = null;
    state.pinned = false;
    els.pinBtn.disabled = false;
    els.pinBtn.textContent = "Clavar en el muro";
  }

  function showError(message) {
    stopTimer();
    els.paper.hidden = true;
    els.benchActions.hidden = true;
    els.errorText.textContent = message || "El taller está saturado. Reintenta en unos segundos.";
    els.errorCard.hidden = false;
    setStatus("Encargo detenido");
    state.busy = false;
    els.makeBtn.disabled = false;
  }

  function finishGeneration(seconds, model) {
    stopTimer();
    state.seconds = seconds;
    state.model = model || state.model;
    els.statusTimer.textContent = fmtSeconds(seconds);
    els.paperMeta.textContent = state.model + " · " + fmtSeconds(seconds);
    els.bench.classList.add("is-done");
    if (state.kind === "app") {
      var cleaned = cleanRaw(state.raw);
      els.paper.classList.add("is-app");
      els.paperBody.innerHTML = "";
      els.paperBody.appendChild(buildAppFrame(cleaned));
      setStatus("Aplicación funcionando");
    } else {
      setStatus("Entregable terminado");
    }
    els.downloadBtn.textContent = state.kind === "app" ? "Descargar HTML" : "Descargar PDF";
    els.benchActions.hidden = false;
    state.busy = false;
    els.makeBtn.disabled = false;
  }

  function paperNumber() {
    var d = new Date();
    return "AEGVE·" + String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0");
  }

  function sampleTabular(text) {
    var clean = text.replace(/\r/g, "");
    if (clean.length <= 13000) return { text: clean.trim(), note: null };
    var lines = clean.split("\n").filter(function (l) {
      return l.trim().length > 0;
    });
    var total = lines.length;
    var header = lines[0];
    var body = lines.slice(1);
    var first = body.slice(0, 120);
    var rest = body.slice(120);
    var step = Math.max(1, Math.ceil(rest.length / 110));
    var sampled = [];
    for (var i = 0; i < rest.length; i += step) sampled.push(rest[i]);
    var out = [header];
    var used = header.length;
    var picked = first.concat(sampled);
    for (var j = 0; j < picked.length; j++) {
      if (used + picked[j].length + 1 > 12500) break;
      out.push(picked[j]);
      used += picked[j].length + 1;
    }
    return {
      text: out.join("\n"),
      note: "El conjunto original tiene " + total.toLocaleString("es-ES") + " filas; se envía una muestra de " + (out.length - 1) + ": las primeras y un muestreo uniforme del resto. Indica en el informe que trabaja sobre una muestra."
    };
  }

  function gatherInput() {
    var styleUrl = els.inputStyleUrl.value.trim() || null;
    if (state.mode === "web") {
      var url = els.inputUrl.value.trim();
      if (!url) return null;
      var company = url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0];
      return { url: url, company: company, styleUrl: styleUrl };
    }
    if (state.mode === "datos") {
      var data = els.inputDatos.value.trim();
      if (!data) return null;
      var sampled = sampleTabular(data);
      state.dataNote = sampled.note;
      if (sampled.note) {
        els.dataChip.textContent = sampled.note.split(";")[0];
        els.dataChip.hidden = false;
      }
      return { data: sampled.text, dataNote: sampled.note, styleUrl: styleUrl };
    }
    var brief = els.inputLibre.value.trim();
    if (!brief) return null;
    return { brief: brief, styleUrl: styleUrl };
  }

  async function fetchWebText(url) {
    setStatus("Leyendo la web");
    try {
      var res = await fetch("/api/fetch-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url })
      });
      var json = await res.json();
      if (json && json.ok) return json;
    } catch (e) {}
    return null;
  }

  async function streamGeneration(payload) {
    var res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok || !res.body) throw new Error("bad response");
    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var buffer = "";
    var finished = false;
    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      var idx;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        var block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        var line = block.split("\n").find(function (l) { return l.indexOf("data:") === 0; });
        if (!line) continue;
        var event;
        try {
          event = JSON.parse(line.slice(5).trim());
        } catch (e) {
          continue;
        }
        if (event.type === "queue") {
          setStatus("En cola · " + event.position + (event.position === 1 ? " encargo por delante" : " encargos por delante"));
        } else if (event.type === "start") {
          state.docType = event.docType;
          state.model = event.model;
          els.paperType.textContent = event.docType;
          els.paperNum.textContent = paperNumber();
          applyBrand(els.paper, els.paperLogo, currentBrand());
          els.paper.hidden = false;
          setStatus("El agente está fabricando");
        } else if (event.type === "model") {
          state.model = event.model;
        } else if (event.type === "delta") {
          state.raw += event.text;
          scheduleRender();
        } else if (event.type === "done") {
          finished = true;
          state.docType = event.docType || state.docType;
          finishGeneration(event.seconds, event.model);
        } else if (event.type === "error") {
          throw new Error(event.message || "error");
        }
      }
    }
    if (!finished) throw new Error("stream cut");
  }

  function ensayoGeneration() {
    var doc = ENSAYO_DOCS[state.mode];
    state.docType = doc.docType;
    state.model = "claude-fable-5";
    els.paperType.textContent = doc.docType;
    els.paperNum.textContent = paperNumber();
    applyBrand(els.paper, els.paperLogo, currentBrand());
    setStatus("En cola · ensayo local");
    setTimeout(function () {
      els.paper.hidden = false;
      setStatus("El agente está fabricando");
      var i = 0;
      var step = 6;
      var handle = setInterval(function () {
        i += step;
        state.raw = doc.html.slice(0, i);
        scheduleRender();
        if (i >= doc.html.length) {
          clearInterval(handle);
          state.raw = doc.html;
          state.kind = "doc";
          scheduleRender();
          finishGeneration((performance.now() - timerStart) / 1000, "claude-fable-5");
        }
      }, 16);
    }, 600);
  }

  async function generate() {
    if (state.busy) return;
    var input = gatherInput();
    if (!input) {
      var field = state.mode === "web" ? els.inputUrl : state.mode === "datos" ? els.inputDatos : els.inputLibre;
      field.focus();
      return;
    }
    state.busy = true;
    state.brand = null;
    state.styleBrand = null;
    els.makeBtn.disabled = true;
    resetBench();
    els.bench.hidden = false;
    els.bench.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus("Preparando el encargo");
    startTimer();
    if (ENSAYO) {
      ensayoGeneration();
      return;
    }
    try {
      if (input.styleUrl) {
        setStatus("Leyendo la web de estilo");
        var styleWeb = await fetchWebText(input.styleUrl);
        if (styleWeb && styleWeb.brand) {
          state.styleBrand = styleWeb.brand;
          els.styleChip.textContent = "Estilo aplicado: " + (styleWeb.title || input.styleUrl).slice(0, 60);
          els.styleChip.hidden = false;
        }
      }
      if (state.mode === "web") {
        var web = await fetchWebText(input.url);
        if (web) {
          input.webText = web.text;
          if (web.title) input.company = web.title;
          if (web.brand && (web.brand.color || web.brand.logo || (web.brand.fonts || []).length)) state.brand = web.brand;
        }
      }
      var profile = brandProfileText(currentBrand());
      if (profile) input.brandProfile = profile;
      setStatus("Encargo enviado al taller");
      await streamGeneration({ mode: state.mode, sector: state.sector, input: input });
    } catch (e) {
      showError("El taller está saturado. Reintenta en unos segundos.");
    }
  }

  async function pinToWall() {
    if (state.pinned) return;
    state.pinned = true;
    els.pinBtn.disabled = true;
    els.pinBtn.textContent = "Clavando";
    var cleaned = cleanRaw(state.raw);
    var title;
    if (state.kind === "app") {
      var tm = cleaned.match(/<title[^>]*>([^<]*)<\/title>/i);
      title = tm && tm[1].trim() ? tm[1].trim() : "Aplicación a medida";
    } else {
      var firstH3 = els.paperBody.querySelector("h3");
      title = firstH3 ? firstH3.textContent.trim() : state.docType;
    }
    var payload = {
      docType: state.kind === "app" ? "Aplicación en vivo" : state.docType,
      sector: state.mode === "web" ? SECTOR_LABELS[state.sector] : "",
      mode: state.mode,
      kind: state.kind || "doc",
      brand: currentBrand(),
      title: title,
      seconds: state.seconds,
      model: state.model,
      html: cleaned
    };
    try {
      var res = await fetch("/api/wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      var json = await res.json();
      if (json && json.ok) {
        els.pinBtn.textContent = "Clavado en el muro";
        await loadWall();
        document.getElementById("muro").scrollIntoView({ behavior: "smooth" });
        return;
      }
      throw new Error("wall");
    } catch (e) {
      state.pinned = false;
      els.pinBtn.disabled = false;
      els.pinBtn.textContent = "Clavar en el muro";
    }
  }

  var wallShown = -1;

  function renderWall(data) {
    if (typeof renderWallCount === "function") {
      renderWallCount(data.count);
    } else {
      els.wallN.textContent = String(data.count);
    }
    if (data.items.length === wallShown) return;
    wallShown = data.items.length;
    els.wallGrid.innerHTML = "";
    data.items.forEach(function (item) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "wall-card";
      var top = document.createElement("div");
      top.className = "wall-card-top";
      var type = document.createElement("span");
      type.className = "wall-card-type";
      type.textContent = item.docType;
      top.appendChild(type);
      if (item.kind === "app") {
        var atag = document.createElement("span");
        atag.className = "wall-tag wall-tag-app";
        atag.textContent = "app";
        top.appendChild(atag);
      }
      if (item.example) {
        var tag = document.createElement("span");
        tag.className = "wall-tag";
        tag.textContent = "ejemplo";
        top.appendChild(tag);
      }
      var title = document.createElement("p");
      title.className = "wall-card-title";
      title.textContent = item.title;
      var meta = document.createElement("div");
      meta.className = "wall-card-meta";
      var bits = [];
      if (item.sector) bits.push(item.sector);
      if (item.time && item.time !== "ensayo") bits.push(item.time + " h");
      if (item.seconds) bits.push(fmtSeconds(item.seconds));
      meta.textContent = bits.join(" · ");
      card.appendChild(top);
      card.appendChild(title);
      card.appendChild(meta);
      card.addEventListener("click", function () {
        openModal(item.id);
      });
      els.wallGrid.appendChild(card);
    });
  }

  async function loadWall() {
    try {
      var res = await fetch("/api/wall");
      var json = await res.json();
      if (json && Array.isArray(json.items)) renderWall(json);
    } catch (e) {}
  }

  var modalItem = null;

  async function openModal(id) {
    try {
      var res = await fetch("/api/wall/" + encodeURIComponent(id));
      var json = await res.json();
      if (!json || !json.ok) return;
      var item = json.item;
      modalItem = item;
      els.modalDownload.textContent = item.kind === "app" ? "Descargar HTML" : "Descargar PDF";
      els.modalType.textContent = item.docType;
      els.modalNum.textContent = item.example ? "ejemplo" : item.time + " h";
      applyBrand(els.modalPaper, els.modalLogo, item.brand || null);
      els.modalPaper.classList.toggle("is-app", item.kind === "app");
      els.modalBody.innerHTML = "";
      if (item.kind === "app") {
        els.modalBody.appendChild(buildAppFrame(item.html));
      } else {
        els.modalBody.innerHTML = item.html;
      }
      els.modalMeta.textContent = (item.model || "") + (item.seconds ? " · " + fmtSeconds(item.seconds) : "");
      els.modal.hidden = false;
      document.body.style.overflow = "hidden";
    } catch (e) {}
  }

  function closeModal() {
    els.modal.hidden = true;
    els.modalBody.innerHTML = "";
    document.body.style.overflow = "";
  }

  function wireFileInput(btn, input, chip, onText) {
    btn.addEventListener("click", function () {
      input.click();
    });
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        onText(String(reader.result || ""), file);
      };
      reader.readAsText(file);
      input.value = "";
    });
  }

  wireFileInput(els.dataFileBtn, els.dataFile, els.dataChip, function (text, file) {
    var sampled = sampleTabular(text);
    els.inputDatos.value = sampled.text;
    state.dataNote = sampled.note;
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim().length > 0; }).length;
    els.dataChip.textContent = file.name + " · " + lines.toLocaleString("es-ES") + " filas" + (sampled.note ? " · muestreado" : "");
    els.dataChip.hidden = false;
  });

  els.modes.forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectMode(btn.dataset.mode);
    });
  });

  els.sectors.forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectSector(btn.dataset.sector);
    });
  });

  els.makeBtn.addEventListener("click", generate);
  els.retryBtn.addEventListener("click", generate);
  els.pinBtn.addEventListener("click", pinToWall);

  els.downloadBtn.addEventListener("click", function () {
    var cleaned = cleanRaw(state.raw);
    var title;
    if (state.kind === "app") {
      var tm = cleaned.match(/<title[^>]*>([^<]*)<\/title>/i);
      title = tm && tm[1].trim() ? tm[1].trim() : "Aplicación a medida";
    } else {
      var firstH3 = els.paperBody.querySelector("h3");
      title = firstH3 ? firstH3.textContent.trim() : state.docType;
    }
    handleDownload(els.downloadBtn, {
      kind: state.kind || "doc",
      docType: state.kind === "app" ? "Aplicación en vivo" : state.docType,
      html: cleaned,
      brand: currentBrand(),
      title: title,
      meta: state.model + " · " + fmtSeconds(state.seconds)
    });
  });

  els.modalDownload.addEventListener("click", function () {
    if (!modalItem) return;
    handleDownload(els.modalDownload, {
      kind: modalItem.kind || "doc",
      docType: modalItem.docType,
      html: modalItem.html,
      brand: modalItem.brand || null,
      title: modalItem.title,
      meta: (modalItem.model || "") + (modalItem.seconds ? " · " + fmtSeconds(modalItem.seconds) : "")
    });
  });

  els.againBtn.addEventListener("click", function () {
    els.bench.hidden = true;
    resetBench();
    document.getElementById("taller").scrollIntoView({ behavior: "smooth" });
  });

  els.modalClose.addEventListener("click", closeModal);
  els.modalBackdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !els.modal.hidden) closeModal();
  });

  els.inputUrl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      generate();
    }
  });

  if (ENSAYO) {
    els.badge.hidden = false;
    els.inputUrl.value = ENSAYO_INPUTS.web;
    els.inputDatos.value = ENSAYO_INPUTS.datos;
    els.inputLibre.value = ENSAYO_INPUTS.libre;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach(function (el) {
    observer.observe(el);
  });

  var motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function animateNumber(el, target, suffix, duration) {
    var t0 = performance.now();
    function tick(now) {
      var k = Math.min(1, (now - t0) / duration);
      k = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * k) + suffix;
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    setTimeout(function () {
      el.textContent = target + suffix;
    }, duration + 150);
  }

  if (motionOK) {
    var statObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          statObserver.unobserve(entry.target);
          var m = entry.target.textContent.trim().match(/^(\d+)(.*)$/);
          if (m) animateNumber(entry.target, parseInt(m[1], 10), m[2], 1200);
        });
      },
      { threshold: 0.6 }
    );
    document.querySelectorAll(".stat .k").forEach(function (el) {
      statObserver.observe(el);
    });
  }

  var parEls = [];

  function collectParallax() {
    parEls = [];
    document.querySelectorAll("[data-par]").forEach(function (el) {
      var fixed = getComputedStyle(el.parentNode).position === "fixed" || getComputedStyle(el).position === "fixed";
      var top = 0;
      if (!fixed) {
        var rect = el.getBoundingClientRect();
        top = rect.top + window.scrollY;
      }
      parEls.push({ el: el, speed: parseFloat(el.dataset.par) || 0, fixed: fixed, top: top, h: el.offsetHeight });
    });
    var delta = document.getElementById("cover-delta");
    if (delta && !delta.dataset.par) {
      var r = delta.getBoundingClientRect();
      parEls.push({ el: delta, speed: 0.12, fixed: false, top: r.top + window.scrollY, h: delta.offsetHeight, base: "rotate(8deg)" });
    }
  }

  var ticking = false;

  function motionFrame() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    els.scrollProgress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    if (!motionOK) return;
    parEls.forEach(function (p) {
      var ty;
      if (p.fixed) {
        ty = -y * p.speed;
      } else {
        var center = p.top + p.h / 2 - y - vh / 2;
        ty = -center * p.speed;
      }
      p.el.style.transform = (p.base || "") + " translate3d(0," + ty.toFixed(1) + "px,0)";
    });
  }

  function requestMotion() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(motionFrame);
    }
  }

  collectParallax();
  requestMotion();
  window.addEventListener("scroll", requestMotion, { passive: true });
  window.addEventListener("resize", function () {
    collectParallax();
    requestMotion();
  });
  window.addEventListener("load", function () {
    collectParallax();
    requestMotion();
  });

  if (motionOK && finePointer) {
    document.querySelectorAll(".cover-cta .btn").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        var dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        btn.style.transform = "translate(" + (dx * 5).toFixed(1) + "px," + (dy * 4).toFixed(1) + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });

    var tiltSelector = ".wall-card, .mode";
    document.addEventListener("mousemove", function (e) {
      var card = e.target.closest && e.target.closest(tiltSelector);
      if (!card) return;
      var r = card.getBoundingClientRect();
      var dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      var dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      card.style.transform = "perspective(700px) rotateX(" + (-dy * 2.4).toFixed(2) + "deg) rotateY(" + (dx * 2.8).toFixed(2) + "deg) translateY(-2px)";
    });
    document.addEventListener("mouseout", function (e) {
      var card = e.target.closest && e.target.closest(tiltSelector);
      if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) {
        card.style.transform = "";
      }
    });
  }

  var wallAnimated = 0;
  var origWallN = els.wallN;
  var renderWallCount = function (count) {
    if (motionOK && count !== wallAnimated && count > 0) {
      animateNumber(origWallN, count, "", 700);
    } else {
      origWallN.textContent = String(count);
    }
    wallAnimated = count;
  };

  window.addEventListener("load", function () {
    ensurePdfLib().catch(function () {});
  });

  var DIRECTOR = new URLSearchParams(location.search).get("director") === "1";

  var salaEls = {
    n: document.getElementById("sala-n"),
    empty: document.getElementById("sala-empty"),
    grid: document.getElementById("sala-grid"),
    q9: document.getElementById("sala-q9"),
    quotes: document.getElementById("sala-quotes"),
    director: document.getElementById("sala-director"),
    registroBtn: document.getElementById("registro-btn"),
    registroFile: document.getElementById("registro-file"),
    registroChip: document.getElementById("registro-chip"),
    informeBtn: document.getElementById("informe-btn"),
    qrImg: document.getElementById("sala-qr-img"),
    url: document.getElementById("sala-url")
  };

  var SALA_POLLS = [
    { q: "q2", title: "¿Sabes lo que es un prompt?", opts: [["a", "Sí, seguro"], ["b", "Me suena"], ["c", "No lo sé"]], base: "total" },
    { q: "q6", title: "¿Sabes qué es la IA agéntica?", opts: [["a", "Sí, seguro"], ["b", "Me suena"], ["c", "No lo sé"]], base: "total" },
    { q: "q3", title: "¿Usas IA en tu día a día?", opts: [["si", "Sí"], ["no", "No"]], base: "total" },
    { q: "q7", title: "¿Has creado o usado un agente?", opts: [["si", "Sí"], ["no", "No"]], base: "total" },
    { q: "q4", title: "Qué IA usa la sala", opts: [["chatgpt", "ChatGPT"], ["copilot", "Copilot"], ["gemini", "Gemini"], ["perplexity", "Perplexity"], ["claude", "Claude"], ["notebooklm", "NotebookLM"], ["otra", "Otra"]], base: "max" },
    { q: "q5", title: "Para qué la usan", opts: [["investigar", "Investigar"], ["traducir", "Traducir"], ["correos", "Correos"], ["presentaciones", "Presentaciones"], ["presupuestos", "Presupuestos"]], base: "max" }
  ];

  var lastAgg = null;
  var lastSalaTotal = -1;
  var lastQ9Key = "";
  var registroText = null;

  function buildSalaGrid() {
    SALA_POLLS.forEach(function (p) {
      var box = document.createElement("div");
      box.className = "poll";
      var title = document.createElement("p");
      title.className = "poll-q";
      title.textContent = p.title;
      box.appendChild(title);
      p.opts.forEach(function (opt) {
        var row = document.createElement("div");
        row.className = "poll-row";
        var label = document.createElement("span");
        label.className = "poll-label";
        label.textContent = opt[1];
        var track = document.createElement("div");
        track.className = "poll-track";
        var fill = document.createElement("div");
        fill.className = "poll-fill";
        fill.dataset.key = p.q + "." + opt[0];
        var num = document.createElement("span");
        num.className = "poll-n";
        num.dataset.numkey = p.q + "." + opt[0];
        num.textContent = "0";
        track.appendChild(fill);
        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(num);
        box.appendChild(row);
      });
      salaEls.grid.appendChild(box);
    });
  }

  function updateSala(agg) {
    lastAgg = agg;
    if (agg.total !== lastSalaTotal) {
      if (motionOK && agg.total > 0) animateNumber(salaEls.n, agg.total, "", 700);
      else salaEls.n.textContent = String(agg.total);
      lastSalaTotal = agg.total;
    }
    var hasData = agg.total > 0;
    salaEls.empty.hidden = hasData;
    salaEls.grid.hidden = !hasData;
    salaEls.q9.hidden = !hasData || !agg.q9.length;
    if (!hasData) return;
    SALA_POLLS.forEach(function (p) {
      var counts = agg[p.q] || {};
      var basis = 0;
      if (p.base === "max") {
        p.opts.forEach(function (opt) {
          basis = Math.max(basis, counts[opt[0]] || 0);
        });
      } else {
        p.opts.forEach(function (opt) {
          basis += counts[opt[0]] || 0;
        });
      }
      p.opts.forEach(function (opt) {
        var val = counts[opt[0]] || 0;
        var pct = Math.round((val / Math.max(1, basis)) * 100);
        var fill = salaEls.grid.querySelector('[data-key="' + p.q + "." + opt[0] + '"]');
        var num = salaEls.grid.querySelector('[data-numkey="' + p.q + "." + opt[0] + '"]');
        if (fill) fill.style.width = pct + "%";
        if (num) num.textContent = p.base === "max" ? String(val) : val + " · " + pct + "%";
      });
    });
    var q9Key = agg.q9.length + "·" + (agg.q9[0] ? agg.q9[0].nick + agg.q9[0].text : "");
    if (q9Key !== lastQ9Key) {
      lastQ9Key = q9Key;
      salaEls.quotes.innerHTML = "";
      agg.q9.forEach(function (item) {
        var card = document.createElement("div");
        card.className = "quote";
        var text = document.createElement("p");
        text.className = "quote-text";
        text.textContent = item.text;
        var nick = document.createElement("p");
        nick.className = "quote-nick";
        nick.textContent = item.nick + (item.time ? " · " + item.time : "");
        card.appendChild(text);
        card.appendChild(nick);
        salaEls.quotes.appendChild(card);
      });
    }
  }

  async function loadSala() {
    try {
      var res = await fetch("/api/encuesta");
      var agg = await res.json();
      if (agg && typeof agg.total === "number") updateSala(agg);
    } catch (e) {}
  }

  function salaSummaryText(agg) {
    var lines = ["Respuestas totales: " + agg.total];
    SALA_POLLS.forEach(function (p) {
      var bits = p.opts.map(function (opt) {
        return opt[1] + ": " + ((agg[p.q] || {})[opt[0]] || 0);
      });
      lines.push(p.title + " — " + bits.join(" · "));
    });
    lines.push("");
    lines.push("Lo que la sala le pide a la IA (pregunta abierta, con el nick de cada autor):");
    agg.q9.forEach(function (item) {
      lines.push("- [" + item.nick + "] " + item.text);
    });
    return lines.join("\n");
  }

  async function generateInforme() {
    if (state.busy) return;
    if (!lastAgg || !lastAgg.total) {
      salaEls.informeBtn.textContent = "Aún no hay respuestas";
      setTimeout(function () {
        salaEls.informeBtn.textContent = "Fabricar el informe de la sala";
      }, 2200);
      return;
    }
    state.busy = true;
    state.brand = null;
    state.styleBrand = null;
    els.makeBtn.disabled = true;
    resetBench();
    els.bench.hidden = false;
    els.bench.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus("Leyendo a la sala");
    startTimer();
    try {
      await streamGeneration({
        mode: "sala",
        sector: "",
        input: { sala: salaSummaryText(lastAgg), registro: registroText }
      });
    } catch (e) {
      showError("El taller está saturado. Reintenta en unos segundos.");
    }
  }

  if (salaEls.grid) {
    var qrTarget = location.origin + "/encuesta";
    salaEls.qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&qzone=1&color=27-27-31&bgcolor=251-250-247&data=" + encodeURIComponent(qrTarget);
    salaEls.url.textContent = qrTarget.replace(/^https?:\/\//, "");
    buildSalaGrid();
    if (DIRECTOR) {
      salaEls.director.hidden = false;
      wireFileInput(salaEls.registroBtn, salaEls.registroFile, salaEls.registroChip, function (text, file) {
        registroText = text.slice(0, 6000);
        var lines = text.split(/\r?\n/).filter(function (l) { return l.trim().length > 0; }).length;
        salaEls.registroChip.textContent = file.name + " · " + (lines - 1) + " asistentes";
        salaEls.registroChip.hidden = false;
      });
      salaEls.informeBtn.addEventListener("click", generateInforme);
    }
    loadSala();
    setInterval(loadSala, 6000);
  }

  loadWall();
  setInterval(loadWall, 10000);
})();
