const express = require("express");
const fs = require("fs");
const path = require("path");
const dns = require("dns").promises;
const net = require("net");

const app = express();
const PORT = process.env.PORT || 3000;
const PRIMARY_MODEL = "claude-fable-5";
const FALLBACK_MODEL = "claude-opus-4-8";
const DATA_DIR = path.join(__dirname, "data");
const WALL_FILE = path.join(DATA_DIR, "wall.json");
const MAX_ACTIVE = 3;

app.use(express.json({ limit: "6mb" }));
app.use(express.static(path.join(__dirname, "public")));

const SEED_WALL = [
  {
    id: "seed-hotel",
    docType: "One-pager comercial",
    sector: "Hotel",
    mode: "web",
    title: "Hotel Mirador del Orzán · Programa Corporate",
    seconds: 8.4,
    model: PRIMARY_MODEL,
    time: "ensayo",
    createdAt: 0,
    example: true,
    html: "<h3>Hotel Mirador del Orzán · Programa Corporate</h3><p>Hotel urbano de cuatro estrellas frente a la playa del Orzán, a doce minutos a pie del distrito financiero de A Coruña. 94 habitaciones, cuatro salas de reunión y desayuno desde las 6:30 pensado para el viajero de empresa.</p><h4>Lo que resuelve a un travel manager</h4><ul><li>Tarifa corporativa fija con desayuno y wifi premium incluidos, sin suplementos de temporada.</li><li>Cancelación flexible hasta las 18:00 del día de llegada.</li><li>Facturación centralizada mensual con desglose por centro de coste.</li><li>Early check-in y late check-out sin cargo para cuentas corporate, sujetos a disponibilidad.</li></ul><h4>Condiciones propuestas</h4><table><thead><tr><th>Concepto</th><th>Condición</th></tr></thead><tbody><tr><td>Tarifa LRA</td><td>[completar] € · doble uso individual</td></tr><tr><td>Volumen mínimo</td><td>40 noches al año</td></tr><tr><td>Revisión</td><td>Anual, con histórico de producción</td></tr></tbody></table><p>Contacto comercial: [completar]. Validez de la propuesta: 30 días.</p>"
  },
  {
    id: "seed-datos",
    docType: "Informe ejecutivo",
    sector: "Empresa",
    mode: "datos",
    title: "Informe ejecutivo · Gasto de viaje T1 2026",
    seconds: 11.2,
    model: PRIMARY_MODEL,
    time: "ensayo",
    createdAt: 0,
    example: true,
    html: "<h3>Informe ejecutivo · Gasto de viaje T1 2026</h3><h4>La foto</h4><p>El gasto total del trimestre asciende a 184.300 €, un 9 % por encima del mismo periodo de 2025. El aéreo concentra el 52 % del gasto, el hotel el 31 % y el resto se reparte entre tren, rent-a-car y dietas.</p><h4>La desviación que importa</h4><p>La antelación media de reserva del aéreo ha caído de 11 a 6 días. Esa caída explica por sí sola unos 14.700 € de sobrecoste, más que cualquier subida de tarifas.</p><h4>La acción recomendada</h4><ul><li>Activar un aviso automático de reserva a 10 días para los trayectos recurrentes Madrid–A Coruña y Madrid–Barcelona.</li><li>Renegociar la tarifa hotelera de Madrid: 412 noches consolidadas al año dan volumen para una LRA.</li><li>Revisar las 23 reservas fuera de política del trimestre: 19 corresponden a dos departamentos.</li></ul>"
  },
  {
    id: "seed-empresa",
    docType: "Diagnóstico exprés",
    sector: "Empresa",
    mode: "web",
    title: "Diagnóstico exprés · Programa de viajes",
    seconds: 7.6,
    model: PRIMARY_MODEL,
    time: "ensayo",
    createdAt: 0,
    example: true,
    html: "<h3>Diagnóstico exprés · Programa de viajes</h3><h4>Señales que da la web</h4><ul><li>Presencia en seis países y equipos comerciales distribuidos: volumen de viaje recurrente casi seguro, sin mención de una política de viajes pública.</li><li>Portal de proveedores con condiciones de compra, pero sin canal equivalente para servicios de viaje: la negociación probablemente está atomizada.</li><li>Compromisos de sostenibilidad publicados sin métrica de emisiones de viaje: hueco evidente para reporting de alcance 3.</li></ul><h4>Tres recomendaciones</h4><ul><li>Consolidar aéreo y hotel en un único canal de reserva antes de negociar: sin dato consolidado no hay descuento.</li><li>Definir una política corta, de una página, con tres reglas claras; las políticas largas no se leen ni se cumplen.</li><li>Incorporar el dato de emisiones por viaje al informe trimestral de sostenibilidad que ya publican.</li></ul><p><em>Elaborado a partir de información pública básica.</em></p>"
  }
];

let wall = [];
try {
  wall = JSON.parse(fs.readFileSync(WALL_FILE, "utf8"));
} catch (e) {
  wall = [];
}
if (!Array.isArray(wall)) wall = [];
if (wall.length === 0) {
  wall = SEED_WALL.slice();
  saveWall();
}

function saveWall() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(WALL_FILE, JSON.stringify(wall, null, 2));
  } catch (e) {}
}

function sanitizeHtml(html) {
  return String(html)
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|form)[^>]*\/?\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

let active = 0;
const waiting = [];

function acquireSlot(notify) {
  return new Promise((resolve) => {
    if (active < MAX_ACTIVE) {
      active += 1;
      resolve();
      return;
    }
    waiting.push({ resolve, notify });
    notify(waiting.length);
  });
}

function releaseSlot() {
  const next = waiting.shift();
  if (next) {
    waiting.forEach((w, i) => w.notify(i + 1));
    next.resolve();
  } else {
    active -= 1;
  }
}

function sse(res, payload) {
  res.write("data: " + JSON.stringify(payload) + "\n\n");
}

const SYSTEM_DOC = [
  "Eres el agente de entregables de Externia en una jornada de AEGVE, la asociación española de gestores de viajes de empresa. El público: hoteles, movilidad y rent-a-car, agencias y TMC, y travel managers de empresa.",
  "Recibes un encargo y produces ÚNICAMENTE el documento final, en español de España, listo para usar: sin saludos, sin explicar lo que vas a hacer, sin notas de IA, sin despedidas.",
  "Estructura profesional con títulos y tablas cuando aporten. Extensión de una página.",
  "Si el encargo trae datos reales, úsalos con rigor y no inventes cifras. Si faltan datos, usa marcadores claros del tipo [completar].",
  "Si el material lo permite, abre con una tabla corta de cifras clave y cierra con un blockquote de una sola frase con la conclusión que importa.",
  "Si el encargo incluye una guía de estilo del cliente, síguela en tono, vocabulario y estructura.",
  "Tono sobrio, directo, sectorial. Frases cortas. Sin exclamaciones. Sin emojis.",
  "Devuelve el documento en HTML simple usando solo h3, h4, p, table, thead, tbody, tr, th, td, ul, ol, li, blockquote, strong y em. Sin estilos inline, sin markdown, sin DOCTYPE y sin etiquetas html, head o body. Empieza directamente con un h3 que sea el título del documento."
].join(" ");

const SYSTEM_LIBRE = [
  "Eres el agente de entregables de Externia en una jornada de AEGVE, la asociación española de gestores de viajes de empresa. Recibes un encargo libre y lo cumples tal cual se pide, produciendo ÚNICAMENTE el entregable final: sin saludos, sin explicar lo que vas a hacer, sin notas de IA.",
  "El encargo manda: formato, extensión, idioma y tono los decide quien pide. En ausencia de indicación, español de España, sobrio y profesional, sin exclamaciones ni emojis.",
  "Si el resultado natural del encargo es un documento, devuélvelo en HTML simple usando solo h3, h4, p, table, thead, tbody, tr, th, td, ul, ol, li, blockquote, strong y em, sin estilos inline, sin DOCTYPE y sin etiquetas html, head o body, empezando por un h3 con el título.",
  "Si el encargo pide algo interactivo o visual —una aplicación, calculadora, simulador, panel, gráfico, juego o presentación—, devuelve un único archivo HTML completo y autónomo: empieza por <!doctype html>, incluye title, CSS y JavaScript embebidos, sin dependencias externas ni CDNs, funcional de una sola pasada y usable en móvil. Estética cuidada: fondo oscuro, tipografía del sistema, acentos cálidos.",
  "Si el encargo trae datos reales, úsalos con rigor y no inventes cifras; marca lo que falte con [completar].",
  "Si el encargo incluye una guía de estilo del cliente, síguela.",
  "Nunca escribas texto fuera del entregable. Sin markdown ni vallas de código."
].join(" ");

const DOC_TYPES_WEB = {
  hotel: "One-pager comercial",
  movilidad: "Propuesta de programa corporativo",
  agencia: "Documento de posicionamiento",
  empresa: "Diagnóstico exprés"
};

const ENCARGOS_WEB = {
  hotel: "Produce un one-pager comercial para que este hotel capte cuentas corporativas, basado en lo que su propia web dice de ellos: qué ofrece al viajero de empresa, qué lo diferencia y qué condiciones corporate propone.",
  movilidad: "Produce una propuesta de programa corporativo de esta empresa de movilidad o rent-a-car dirigida a un cliente tipo: alcance del servicio, condiciones y compromisos de nivel de servicio.",
  agencia: "Produce un documento de posicionamiento para esta agencia o TMC: qué les diferencia según su propia web y a qué tipo de cuenta deberían atacar, con argumentario breve.",
  empresa: "Produce un diagnóstico exprés del programa de viajes de esta empresa: qué señales da su web sobre cómo viaja y compra viajes, y exactamente 3 recomendaciones accionables."
};

function appendStyleGuide(parts, input) {
  if (input && input.styleGuide) {
    parts.push("Guía de estilo del cliente, aplícala al tono, vocabulario, estructura y prioridades del entregable:");
    parts.push('"""' + String(input.styleGuide).slice(0, 4000) + '"""');
  }
}

function buildPrompt(mode, sector, input) {
  if (mode === "web") {
    const s = DOC_TYPES_WEB[sector] ? sector : "empresa";
    const docType = DOC_TYPES_WEB[s];
    const parts = [ENCARGOS_WEB[s]];
    parts.push("Empresa: " + String(input.company || input.url || "[completar]").slice(0, 200) + ".");
    if (input.webText) {
      parts.push("Texto extraído de su web pública (puede contener ruido de navegación, ignóralo):");
      parts.push('"""' + String(input.webText).slice(0, 8000) + '"""');
    } else {
      parts.push("No ha sido posible leer su web completa. Trabaja a partir del nombre de la empresa, su dominio y el sector, sin inventar datos concretos: usa [completar] donde falte información. Incluye tras el título un p con em que diga exactamente: Elaborado a partir de información pública básica.");
    }
    appendStyleGuide(parts, input);
    return { docType, userPrompt: parts.join("\n\n") };
  }
  if (mode === "datos") {
    const docType = "Informe ejecutivo";
    const parts = [
      "Produce un informe ejecutivo de una página a partir de estos datos tabulares. Estructura obligatoria: la foto general, la desviación que importa y la acción recomendada. Usa una tabla solo si condensa mejor que el texto.",
      "Si los datos no son interpretables, dilo con elegancia y marca lo que falta con [completar]."
    ];
    if (input.dataNote) {
      parts.push("Nota sobre los datos: " + String(input.dataNote).slice(0, 300));
    }
    parts.push("Datos aportados por el asistente:");
    parts.push('"""' + String(input.data || "").slice(0, 14000) + '"""');
    appendStyleGuide(parts, input);
    return { docType, userPrompt: parts.join("\n\n") };
  }
  const docType = "Encargo libre";
  const parts = [
    "Encargo libre de un asistente de la jornada. Cúmplelo tal cual se pide y entrega el resultado terminado.",
    "Encargo:",
    '"""' + String(input.brief || "").slice(0, 6000) + '"""'
  ];
  appendStyleGuide(parts, input);
  return { docType, userPrompt: parts.join("\n\n") };
}

async function streamAnthropic(model, system, maxTokens, userPrompt, onDelta, signal) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      system,
      messages: [{ role: "user", content: userPrompt }]
    }),
    signal
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const err = new Error("api " + response.status);
    err.status = response.status;
    err.body = body;
    throw err;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        let event;
        try {
          event = JSON.parse(data);
        } catch (e) {
          continue;
        }
        if (event.type === "content_block_delta" && event.delta && typeof event.delta.text === "string") {
          onDelta(event.delta.text);
        }
        if (event.type === "error") {
          const err = new Error("stream error");
          err.body = JSON.stringify(event);
          throw err;
        }
      }
    }
  }
}

app.post("/api/generate", async (req, res) => {
  const body = req.body || {};
  const mode = ["web", "datos", "libre"].includes(body.mode) ? body.mode : null;
  if (!mode) {
    res.status(400).json({ ok: false });
    return;
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  let closed = false;
  res.on("close", () => {
    closed = true;
  });
  await acquireSlot((position) => {
    if (!closed) sse(res, { type: "queue", position });
  });
  if (closed) {
    releaseSlot();
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    sse(res, { type: "error", message: "El taller está saturado. Reintenta en unos segundos." });
    res.end();
    releaseSlot();
    return;
  }
  const { docType, userPrompt } = buildPrompt(mode, String(body.sector || ""), body.input || {});
  const isLibre = mode === "libre";
  const system = isLibre ? SYSTEM_LIBRE : SYSTEM_DOC;
  const maxTokens = isLibre ? 6000 : 1800;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), isLibre ? 150000 : 90000);
  const startedAt = Date.now();
  let model = PRIMARY_MODEL;
  let emitted = 0;
  const onDelta = (text) => {
    emitted += 1;
    if (!closed) sse(res, { type: "delta", text });
  };
  try {
    sse(res, { type: "start", docType, model });
    try {
      await streamAnthropic(PRIMARY_MODEL, system, maxTokens, userPrompt, onDelta, controller.signal);
    } catch (err) {
      if (emitted === 0 && !controller.signal.aborted) {
        model = FALLBACK_MODEL;
        sse(res, { type: "model", model });
        await streamAnthropic(FALLBACK_MODEL, system, maxTokens, userPrompt, onDelta, controller.signal);
      } else {
        throw err;
      }
    }
    const seconds = Math.round((Date.now() - startedAt) / 100) / 10;
    sse(res, { type: "done", seconds, model, docType });
  } catch (err) {
    if (!closed) {
      sse(res, { type: "error", message: "El taller está saturado. Reintenta en unos segundos." });
    }
  } finally {
    clearTimeout(timer);
    releaseSlot();
    res.end();
  }
});

const PRIVATE_V4 = [/^10\./, /^127\./, /^169\.254\./, /^192\.168\./, /^0\./];

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    if (PRIVATE_V4.some((re) => re.test(ip))) return true;
    if (ip.startsWith("172.")) {
      const second = Number(ip.split(".")[1]);
      if (second >= 16 && second <= 31) return true;
    }
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) return true;
  if (lower.startsWith("::ffff:")) return isPrivateIp(lower.slice(7));
  return false;
}

function colorMetrics(hex) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return {
    sat: max === 0 ? 0 : (max - min) / max,
    lum: (r * 0.299 + g * 0.587 + b * 0.114) / 255
  };
}

function pickBrandColor(html) {
  const themeMatch =
    html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']#?([0-9a-fA-F]{6})["']/i) ||
    html.match(/<meta[^>]+content=["']#?([0-9a-fA-F]{6})["'][^>]+name=["']theme-color["']/i);
  if (themeMatch) {
    const hex = themeMatch[1].toLowerCase();
    const m = colorMetrics(hex);
    if (m.sat >= 0.25 && m.lum >= 0.1 && m.lum <= 0.9) return "#" + hex;
  }
  const counts = {};
  const re = /#([0-9a-fA-F]{6})\b/g;
  let match;
  while ((match = re.exec(html))) {
    const hex = match[1].toLowerCase();
    counts[hex] = (counts[hex] || 0) + 1;
  }
  let best = null;
  let bestScore = 0;
  for (const hex of Object.keys(counts)) {
    const m = colorMetrics(hex);
    if (m.sat < 0.35 || m.lum < 0.1 || m.lum > 0.9) continue;
    const score = counts[hex] * (0.5 + m.sat);
    if (score > bestScore) {
      bestScore = score;
      best = "#" + hex;
    }
  }
  return best;
}

function pickLogo(html, baseUrl) {
  const patterns = [
    /<link[^>]+rel=["']apple-touch-icon[^"']*["'][^>]*>/i,
    /<img[^>]+(?:class|id|alt|src)=["'][^"']*logo[^"']*["'][^>]*>/i,
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>/i
  ];
  for (const pattern of patterns) {
    const tag = (html.match(pattern) || [])[0];
    if (!tag) continue;
    const src = (tag.match(/(?:href|src)=["']([^"']+)["']/i) || [])[1];
    if (!src || src.indexOf("data:") === 0) continue;
    try {
      const resolved = new URL(src, baseUrl).href;
      if (/^https?:/i.test(resolved)) return resolved.slice(0, 500);
    } catch (e) {}
  }
  return null;
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-z#0-9]+;/gi, " ");
}

app.post("/api/fetch-web", async (req, res) => {
  try {
    let raw = String((req.body || {}).url || "").trim();
    if (!raw) throw new Error("empty");
    if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("host");
    if (net.isIP(host)) {
      if (isPrivateIp(host)) throw new Error("ip");
    } else {
      const records = await dns.lookup(host, { all: true });
      if (records.some((r) => isPrivateIp(r.address))) throw new Error("ip");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url.href, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 ExterniaTaller/1.0",
        Accept: "text/html,application/xhtml+xml"
      }
    });
    clearTimeout(timer);
    if (!response.ok) throw new Error("status");
    const html = (await response.text()).slice(0, 800000);
    const rawTitle = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";
    const text = decodeEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<[^>]+>/g, " ")
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
    if (text.length < 120) throw new Error("thin");
    const brand = {
      color: pickBrandColor(html),
      logo: pickLogo(html, response.url || url.href)
    };
    res.json({ ok: true, title: decodeEntities(rawTitle).replace(/\s+/g, " ").trim().slice(0, 160), text, brand });
  } catch (err) {
    res.json({ ok: false });
  }
});

app.get("/api/wall", (req, res) => {
  res.json({
    count: wall.filter((item) => !item.example).length,
    items: wall.map((item) => ({
      id: item.id,
      docType: item.docType,
      sector: item.sector,
      mode: item.mode,
      kind: item.kind || "doc",
      title: item.title,
      seconds: item.seconds,
      model: item.model,
      time: item.time,
      createdAt: item.createdAt,
      example: item.example
    }))
  });
});

app.get("/api/wall/:id", (req, res) => {
  const item = wall.find((it) => it.id === req.params.id);
  if (!item) {
    res.status(404).json({ ok: false });
    return;
  }
  res.json({ ok: true, item });
});

app.post("/api/wall", (req, res) => {
  const b = req.body || {};
  const kind = b.kind === "app" ? "app" : "doc";
  const rawHtml = String(b.html || "");
  const html = (kind === "app" ? rawHtml : sanitizeHtml(rawHtml)).slice(0, 300000);
  if (!html || html.length < 40) {
    res.status(400).json({ ok: false });
    return;
  }
  const rawBrand = b.brand || {};
  const brandColor = /^#[0-9a-f]{6}$/i.test(String(rawBrand.color || "")) ? String(rawBrand.color).toLowerCase() : null;
  const brandLogo = /^https?:\/\//i.test(String(rawBrand.logo || "")) ? String(rawBrand.logo).slice(0, 500) : null;
  const item = {
    id: "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    docType: String(b.docType || "Documento").slice(0, 80),
    sector: String(b.sector || "").slice(0, 40),
    mode: String(b.mode || "").slice(0, 20),
    kind,
    brand: brandColor || brandLogo ? { color: brandColor, logo: brandLogo } : null,
    title: String(b.title || "Documento generado").slice(0, 140),
    seconds: Math.max(0, Math.min(600, Number(b.seconds) || 0)),
    model: String(b.model || "").slice(0, 60),
    time: new Date().toLocaleTimeString("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }),
    createdAt: Date.now(),
    example: false,
    html
  };
  wall.unshift(item);
  if (wall.length > 300) wall.pop();
  saveWall();
  res.json({ ok: true, item });
});

app.listen(PORT, () => {
  console.log("El taller en http://localhost:" + PORT);
});
