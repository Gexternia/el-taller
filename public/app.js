(function () {
  document.body.classList.add("js");

  var ENSAYO = new URLSearchParams(location.search).get("ensayo") === "1";

  var state = {
    mode: "web",
    sector: "hotel",
    busy: false,
    raw: "",
    docType: "Documento",
    model: "claude-fable-5",
    seconds: 0,
    pinned: false
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
    modalType: document.getElementById("modal-type"),
    modalNum: document.getElementById("modal-num"),
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
    hotel: "Entregable: one-pager comercial para captar cuentas corporativas.",
    movilidad: "Entregable: propuesta de programa corporativo para un cliente tipo.",
    agencia: "Entregable: documento de posicionamiento y a qué cuenta atacar.",
    empresa: "Entregable: diagnóstico exprés del programa de viajes con tres recomendaciones."
  };

  var ENSAYO_INPUTS = {
    web: "atticahotels.example.com",
    datos: "mes,gasto_aereo,gasto_hotel,reservas\nenero,21400,11200,38\nfebrero,19800,10900,35\nmarzo,26900,12400,41\nabril,31200,13100,44",
    libre: "Una política de viajes de una página para una pyme de 40 empleados con oficinas en A Coruña y Madrid."
  };

  var ENSAYO_DOCS = {
    web: { docType: "One-pager comercial", html: "<h3>Attica Hoteles · Programa Corporate A Coruña</h3><p><em>Elaborado a partir de información pública básica.</em></p><p>Cadena hotelera urbana con presencia en Galicia y enfoque en el viajero de empresa: ubicaciones céntricas, salas de reunión y restauración propia.</p><h4>Propuesta para cuentas corporativas</h4><ul><li>Tarifa corporativa fija anual con desayuno y wifi incluidos.</li><li>Cancelación flexible hasta el día de llegada.</li><li>Facturación centralizada mensual con desglose por centro de coste.</li><li>Interlocutor único para el travel manager.</li></ul><h4>Condiciones</h4><table><thead><tr><th>Concepto</th><th>Condición</th></tr></thead><tbody><tr><td>Tarifa LRA</td><td>[completar] € · doble uso individual</td></tr><tr><td>Volumen mínimo</td><td>[completar] noches al año</td></tr><tr><td>Revisión</td><td>Anual con histórico de producción</td></tr></tbody></table><p>Contacto comercial: [completar]. Validez: 30 días.</p>" },
    datos: { docType: "Informe ejecutivo", html: "<h3>Informe ejecutivo · Gasto de viaje enero–abril</h3><h4>La foto</h4><p>El gasto acumulado del cuatrimestre asciende a 147.700 €: 99.300 € de aéreo y 47.600 € de hotel, con 158 reservas. El gasto medio por reserva sube de 858 € en enero a 1.007 € en abril.</p><h4>La desviación que importa</h4><p>El aéreo de abril (31.200 €) crece un 46 % sobre enero con solo un 16 % más de reservas: el precio medio por billete se ha disparado. El hotel se mantiene estable.</p><h4>La acción recomendada</h4><ul><li>Auditar la antelación de compra de los billetes de marzo y abril antes de renegociar tarifas.</li><li>Fijar un techo de tarifa aérea por trayecto recurrente y alertar las compras que lo superen.</li><li>Mantener el programa hotelero tal cual: no es la fuga.</li></ul>" },
    libre: { docType: "Documento a medida", html: "<h3>Política de viajes · Pyme de 40 empleados</h3><p>Vigencia: a partir del 1 de julio de 2026. Aplica a todos los empleados que viajen por cuenta de la empresa desde las oficinas de A Coruña y Madrid.</p><h4>Tres reglas</h4><ul><li>Reserva con un mínimo de 10 días de antelación por el canal corporativo. Excepciones: aprobación del responsable directo.</li><li>Techo por noche de hotel: 110 € en Madrid y Barcelona, 85 € en el resto de España. Internacional: [completar].</li><li>Clase turista en vuelos de menos de 5 horas. Tren antes que avión cuando el trayecto sea inferior a 3 horas.</li></ul><h4>Aprobaciones</h4><table><thead><tr><th>Caso</th><th>Quién aprueba</th></tr></thead><tbody><tr><td>Nacional dentro de política</td><td>Automática</td></tr><tr><td>Internacional</td><td>Responsable de área</td></tr><tr><td>Fuera de política</td><td>Dirección</td></tr></tbody></table><p>Los gastos se liquidan en los 5 días siguientes al regreso, con justificante digital.</p>" }
  };

  var timerHandle = null;
  var timerStart = 0;
  var renderQueued = false;

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

  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(function () {
      renderQueued = false;
      els.paperBody.innerHTML = cleanRaw(state.raw);
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
    els.paperBody.innerHTML = "";
    els.paperMeta.textContent = "";
    els.statusTimer.textContent = "0,0 s";
    state.raw = "";
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
    setStatus("Entregable terminado");
    els.benchActions.hidden = false;
    state.busy = false;
    els.makeBtn.disabled = false;
  }

  function paperNumber() {
    var d = new Date();
    return "AEGVE·" + String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0");
  }

  function gatherInput() {
    if (state.mode === "web") {
      var url = els.inputUrl.value.trim();
      if (!url) return null;
      var company = url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0];
      return { url: url, company: company };
    }
    if (state.mode === "datos") {
      var data = els.inputDatos.value.trim();
      if (!data) return null;
      return { data: data };
    }
    var brief = els.inputLibre.value.trim();
    if (!brief) return null;
    return { brief: brief };
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
          els.paper.hidden = false;
          setStatus("El agente está fabricando");
        } else if (event.type === "model") {
          state.model = event.model;
        } else if (event.type === "delta") {
          state.raw += event.text;
          scheduleRender();
        } else if (event.type === "done") {
          finished = true;
          scheduleRender();
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
    var firstH3 = els.paperBody.querySelector("h3");
    var title = firstH3 ? firstH3.textContent.trim() : state.docType;
    var payload = {
      docType: state.docType,
      sector: state.mode === "web" ? SECTOR_LABELS[state.sector] : "",
      mode: state.mode,
      title: title,
      seconds: state.seconds,
      model: state.model,
      html: cleanRaw(state.raw)
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
      els.modalBody.innerHTML = item.html;
      els.modalMeta.textContent = (item.model || "") + (item.seconds ? " · " + fmtSeconds(item.seconds) : "");
      els.modal.hidden = false;
      document.body.style.overflow = "hidden";
    } catch (e) {}
  }

  function closeModal() {
    els.modal.hidden = true;
    document.body.style.overflow = "";
  }

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
