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
    inputStyle: document.getElementById("input-style"),
    dataFileBtn: document.getElementById("data-file-btn"),
    dataFile: document.getElementById("data-file"),
    dataChip: document.getElementById("data-chip"),
    styleFileBtn: document.getElementById("style-file-btn"),
    styleFile: document.getElementById("style-file"),
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
    againBtn: document.getElementById("again-btn"),
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

  function styleGuideAccent() {
    var guide = els.inputStyle.value || "";
    var m = guide.match(/#[0-9a-fA-F]{6}\b/);
    return m ? m[0].toLowerCase() : null;
  }

  function applyBrand(paperEl, logoEl, brand) {
    paperEl.style.removeProperty("--doc-accent");
    logoEl.hidden = true;
    logoEl.removeAttribute("src");
    if (!brand) return;
    if (brand.color) paperEl.style.setProperty("--doc-accent", darkenIfLight(brand.color));
    if (brand.logo) {
      logoEl.onerror = function () {
        logoEl.hidden = true;
      };
      logoEl.src = brand.logo;
      logoEl.hidden = false;
    }
  }

  function currentBrand() {
    var accent = styleGuideAccent();
    var brand = state.brand;
    if (!accent && !brand) return null;
    return {
      color: accent || (brand && brand.color) || null,
      logo: (brand && brand.logo) || null
    };
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
    var styleGuide = els.inputStyle.value.trim().slice(0, 4000) || null;
    if (state.mode === "web") {
      var url = els.inputUrl.value.trim();
      if (!url) return null;
      var company = url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0];
      return { url: url, company: company, styleGuide: styleGuide };
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
      return { data: sampled.text, dataNote: sampled.note, styleGuide: styleGuide };
    }
    var brief = els.inputLibre.value.trim();
    if (!brief) return null;
    return { brief: brief, styleGuide: styleGuide };
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
      if (state.mode === "web") {
        var web = await fetchWebText(input.url);
        if (web) {
          input.webText = web.text;
          if (web.title) input.company = web.title;
          if (web.brand && (web.brand.color || web.brand.logo)) state.brand = web.brand;
        }
      }
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
    els.wallN.textContent = String(data.count);
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

  async function openModal(id) {
    try {
      var res = await fetch("/api/wall/" + encodeURIComponent(id));
      var json = await res.json();
      if (!json || !json.ok) return;
      var item = json.item;
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

  wireFileInput(els.styleFileBtn, els.styleFile, els.styleChip, function (text, file) {
    els.inputStyle.value = text.slice(0, 4000);
    els.styleChip.textContent = file.name;
    els.styleChip.hidden = false;
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

  loadWall();
  setInterval(loadWall, 10000);
})();
