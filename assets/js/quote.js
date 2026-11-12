/* Fixit4U — repair quote lookup (pricing.html) */
(function () {
  "use strict";
  var tool = document.querySelector("[data-quote-tool]");
  var P = window.FIXIT_PRICING;
  if (!tool || !P) return;
  var C = window.FIXIT || {};
  var H = window.FIXIT_HOURS;

  var devWrap = tool.querySelector("[data-q-devices]");
  var modelsBox = tool.querySelector("[data-q-models]");
  var modelsHint = tool.querySelector("[data-q-models-hint]");
  var findInput = tool.querySelector("[data-q-find]");
  var seriesWrap = tool.querySelector("[data-q-series]");
  var modelList = tool.querySelector("[data-q-model-list]");
  var noMatch = tool.querySelector("[data-q-nomatch]");
  var repWrap = tool.querySelector("[data-q-repairs]");
  var repHint = tool.querySelector("[data-q-repairs-hint]");
  var result = tool.querySelector("[data-q-result]");
  var bar = tool.querySelector("[data-q-bar]");
  var progress = tool.querySelector("[data-q-progress]");
  var steps = [].slice.call(tool.querySelectorAll("[data-q-step]"));
  var narrow = window.matchMedia("(max-width: 899px)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = { device: null, model: "", repair: null, series: "", part: "" };
  var partsBox = tool.querySelector("[data-q-parts]");
  var partList = tool.querySelector("[data-q-part-list]");

  var SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var ICONS = {
    "iphone": '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
    "samsung": '<rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="5" r=".6"/>',
    "phone-other": '<rect x="6" y="3" width="9" height="17" rx="2"/><path d="M18 7v9"/>',
    "tablet": '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M11 18h2"/>',
    "laptop": '<path d="M4 5h16v11H4z"/><path d="M2 19h20"/>',
    "console": '<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01"/><path d="M17.32 5H6.68a4 4 0 0 0-3.98 3.59l-.6 5.4A2.6 2.6 0 0 0 4.7 17c.9 0 1.73-.45 2.2-1.2l.8-1.3h8.6l.8 1.3a2.6 2.6 0 0 0 4.8-1.4l-.6-5.4A4 4 0 0 0 17.32 5z"/>',
    "watch": '<circle cx="12" cy="12" r="6"/><path d="M12 10v2l1 1"/><path d="m16 7.7-.7-4a2 2 0 0 0-2-1.7h-2.6a2 2 0 0 0-2 1.7l-.7 4M8 16.3l.7 4a2 2 0 0 0 2 1.7h2.6a2 2 0 0 0 2-1.7l.7-4"/>',
    "other": '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>'
  };
  var CHECK = SVG + '<path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  var PHONES = ["iphone", "samsung", "phone-other"];
  var QUICK = ["screen", "battery", "charging-port", "camera", "back-glass", "speaker"];
  var SERVICES = ["data-transfer", "unlock", "sell"];

  function deviceById(id) { return P.devices.find(function (d) { return d.id === id; }); }
  function money(n) { return "$" + Number(n).toLocaleString("en-US"); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------- Prices ---------- */
  function findPrice(dev, model, repair) {
    var pr = P.prices || {};
    return pr[dev + "|" + model + "|" + repair] || pr[dev + "|*|" + repair] || null;
  }
  function range(p) { return p.to && p.to !== p.from ? money(p.from) + "–" + money(p.to) : p.to ? money(p.from) : "from " + money(p.from); }
  // lowest "from" price for a device (and optionally a repair), across all models
  function lowest(dev, repair) {
    var best = null, pr = P.prices || {};
    Object.keys(pr).forEach(function (k) {
      var p = k.split("|");
      if (p[0] === dev && (!repair || p[2] === repair) && pr[k].from != null && (best === null || pr[k].from < best)) best = pr[k].from;
    });
    return best;
  }

  /* ---------- Model series (iPhone 17, 16 … / Galaxy S25, S24 …) ---------- */
  function seriesOf(devId, m) {
    var x;
    if (devId === "iphone") {
      if (/Air/.test(m)) return "17";
      x = m.match(/iPhone (\d+)/);
      return x && +x[1] >= 11 ? x[1] : "Older";
    }
    if (devId === "samsung") {
      x = m.match(/Galaxy (S\d+)/);
      return x ? x[1] : "Fold, Flip & more";
    }
    return "";
  }
  function seriesList(dev) {
    var out = [];
    dev.models.forEach(function (m) { var s = seriesOf(dev.id, m); if (out.indexOf(s) < 0) out.push(s); });
    return out.length > 1 ? out : [];
  }

  function radio(name, value, label, checked, icon, idx) {
    var id = "q-" + name + "-" + (idx != null ? idx : value);
    var wrap = el("span", "chip");
    var input = document.createElement("input");
    input.type = "radio"; input.name = name; input.id = id; input.value = value;
    if (checked) input.checked = true;
    var lab = document.createElement("label");
    lab.htmlFor = id;
    if (icon) lab.innerHTML = SVG + icon + "</svg>";
    lab.appendChild(document.createTextNode(label));
    wrap.appendChild(input); wrap.appendChild(lab);
    return wrap;
  }
  function tag(chip) {
    var lab = chip.querySelector("label"), t = lab.querySelector(".p");
    if (!t) { t = el("span", "p"); lab.appendChild(t); }
    return t;
  }

  P.devices.forEach(function (d) { devWrap.appendChild(radio("device", d.id, d.label, false, ICONS[d.id])); });

  /* ---------- Step 2: models ---------- */
  function fillModels() {
    var dev = deviceById(state.device);
    modelList.innerHTML = ""; seriesWrap.innerHTML = ""; findInput.value = "";
    if (!dev) { modelsBox.hidden = true; modelsHint.hidden = false; state.model = ""; return; }
    modelsBox.hidden = false; modelsHint.hidden = true;
    if (dev.models.indexOf(state.model) < 0) state.model = dev.models.length === 1 ? dev.models[0] : "";
    dev.models.forEach(function (m, i) {
      var c = radio("model", m, m, m === state.model, null, dev.id + "-" + i);
      c.setAttribute("data-series", seriesOf(dev.id, m));
      c.setAttribute("data-find", m.toLowerCase());
      modelList.appendChild(c);
    });
    var list = seriesList(dev);
    state.series = state.model ? seriesOf(dev.id, state.model) : (list[0] || "");
    list.forEach(function (s) {
      var b = el("button", "", s);
      b.type = "button";
      b.setAttribute("data-s", s);
      b.addEventListener("click", function () { state.series = s; findInput.value = ""; filterModels(); });
      seriesWrap.appendChild(b);
    });
    seriesWrap.hidden = !list.length;
    modelsBox.querySelector(".q-find").hidden = dev.models.length < 9;
    filterModels();
  }

  function filterModels() {
    var q = findInput.value.trim().toLowerCase().replace(/iphone|galaxy/g, " ");
    var words = q.split(/\s+/).filter(Boolean);
    var shown = 0;
    modelList.querySelectorAll(".chip").forEach(function (c) {
      var on = words.length
        ? words.every(function (w) { return (" " + c.getAttribute("data-find") + " ").indexOf(w) >= 0; })
        : !state.series || c.getAttribute("data-series") === state.series;
      // "15 pro" should not match "15 Pro Max" first-only; all matches are shown
      c.hidden = !on;
      if (on) shown++;
    });
    seriesWrap.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(!words.length && b.getAttribute("data-s") === state.series));
    });
    noMatch.hidden = shown > 0;
  }

  /* ---------- Step 3: repairs ---------- */
  /* ---------- Screen quality (iPhone screens) ---------- */
  function partOptions() {
    var opts = P.partChoices ? P.partChoices(state.device, state.model, state.repair) : null;
    return opts ? opts.concat([{ id: "unsure", label: "Not sure, help me choose" }]) : null;
  }
  function partLabel() {
    var o = (partOptions() || []).filter(function (x) { return x.id === state.part; })[0];
    return o && o.id !== "unsure" ? o.label : "";
  }
  function fillParts() {
    var opts = partOptions();
    partList.innerHTML = "";
    if (!opts) { partsBox.hidden = true; state.part = ""; return; }
    if (!opts.some(function (o) { return o.id === state.part; })) state.part = "unsure";
    opts.forEach(function (o) { partList.appendChild(radio("part", o.id, o.label, o.id === state.part)); });
    partsBox.querySelector(".q-parts-label").textContent = state.repair === "screen" ? "Screen quality" : "Part quality";
    partsBox.hidden = false;
  }

  function fillRepairs() {
    var dev = deviceById(state.device);
    repWrap.innerHTML = "";
    if (!dev) { repHint.hidden = false; return; }
    repHint.hidden = true;
    if (dev.repairs.indexOf(state.repair) < 0) state.repair = null;
    dev.repairs.forEach(function (r) { repWrap.appendChild(radio("repair", r, P.repairs[r] || r, r === state.repair)); });
  }

  /* Price tags on model and repair buttons */
  function updateTags() {
    var dev = deviceById(state.device);
    if (!dev) return;
    modelList.querySelectorAll(".chip").forEach(function (c) {
      var m = c.querySelector("input").value, t = "";
      if (state.repair) { var p = findPrice(dev.id, m, state.repair); if (p && p.from != null) t = range(p); }
      else { var s = findPrice(dev.id, m, "screen"); if (s && s.from != null) t = "Screen " + range(s); }
      tag(c).textContent = t;
      tag(c).hidden = !t;
    });
    repWrap.querySelectorAll(".chip").forEach(function (c) {
      var r = c.querySelector("input").value, t = "";
      if (state.model) { var p = findPrice(dev.id, state.model, r); if (p && p.from != null) t = range(p); }
      else { var lo = lowest(dev.id, r); if (lo != null) t = "from " + money(lo); }
      tag(c).textContent = t;
      tag(c).hidden = !t;
    });
  }

  /* ---------- Progress and locked steps ---------- */
  function updateProgress() {
    var done = [!!state.device, !!state.model, !!state.repair];
    var n = done.filter(Boolean).length;
    steps.forEach(function (s, i) {
      s.classList.toggle("is-done", done[i]);
      s.classList.toggle("is-current", !done[i] && (i === 0 || done[0]) && done.slice(0, i).every(Boolean));
      s.classList.toggle("is-locked", i > 0 && !state.device);
    });
    bar.style.width = (n / 3 * 100) + "%";
    progress.textContent = n === 3 ? "All set" : n === 0 ? "3 quick steps" : n + " of 3 done";
  }

  /* ---------- Live shop status ---------- */
  function shopStatus() {
    if (!H || !C.hours) return null;
    var hours = C.hours, now = H.shopNow();
    var idx = hours.findIndex(function (h) { return h.day === now.day; });
    if (idx < 0) return null;
    var t = hours[idx];
    if (t.open && now.mins >= H.toMin(t.open) && now.mins < H.toMin(t.close)) {
      return { open: true, text: "Open now until " + H.fmtTime(t.close) + ". Walk in any time." };
    }
    if (t.open && now.mins < H.toMin(t.open)) return { open: false, text: "Opens today at " + H.fmtTime(t.open) + "." };
    for (var k = 1; k <= 7; k++) {
      var n = hours[(idx + k) % 7];
      if (n.open) return { open: false, text: "Closed now. Opens " + (k === 1 ? "tomorrow" : n.day) + " at " + H.fmtTime(n.open) + "." };
    }
    return null;
  }
  function statusLine() {
    var st = shopStatus();
    if (!st) return null;
    var s = el("p", "quote-status " + (st.open ? "is-open" : "is-closed"));
    s.appendChild(el("span", "dot"));
    s.appendChild(document.createTextNode(st.text));
    return s;
  }
  function inclList(items) {
    var ul = el("ul", "quote-incl");
    ul.setAttribute("aria-label", "Included");
    items.forEach(function (t) { var li = el("li"); li.innerHTML = CHECK; li.appendChild(document.createTextNode(t)); ul.appendChild(li); });
    return ul;
  }

  /* ---------- Card before a quote is ready: starting prices ---------- */
  function renderIdle(dev) {
    result.classList.add("is-idle");
    var starts = [], pr = P.prices || {}, seen = {};
    Object.keys(pr).forEach(function (k) {
      var p = k.split("|"), key = p[0] + "|" + p[2];
      if (seen[key] || (dev && p[0] !== dev.id)) return;
      seen[key] = 1;
      var d = deviceById(p[0]);
      if (d) starts.push({ dev: d, repair: p[2], from: lowest(p[0], p[2]) });
    });
    if (starts.length) {
      result.appendChild(el("p", "quote-kicker", dev ? dev.label + " starting prices" : "Starting prices"));
      var ul = el("ul", "quote-starts");
      starts.slice(0, 5).forEach(function (s) {
        var li = el("li");
        var a = el("a");
        a.href = "pricing.html?device=" + s.dev.id + "&repair=" + s.repair;
        a.appendChild(el("span", "", s.dev.label + " " + (P.repairs[s.repair] || s.repair).toLowerCase().replace(/ replacement| repair/, "")));
        a.appendChild(el("b", "", "from " + money(s.from)));
        a.addEventListener("click", function (e) { e.preventDefault(); choose(s.dev.id, s.repair, state.model); focusNext(); });
        li.appendChild(a);
        ul.appendChild(li);
      });
      result.appendChild(ul);
    }
    result.appendChild(el("p", "quote-empty",
      !dev ? "Pick your device to see your price."
        : !state.model ? "Now choose the model."
        : "Last step: what needs fixing?"));
    result.appendChild(inclList(["90-day technical warranty", "Walk-ins welcome", "Most phones in about 30 min", "$5–$10 discounts"]));
    var s = statusLine();
    if (s) result.appendChild(s);
  }

  /* ---------- Result card ---------- */
  function render() {
    updateProgress();
    updateTags();
    var dev = deviceById(state.device);
    result.innerHTML = "";
    result.classList.remove("is-ready", "is-idle");
    if (!dev || !state.model || !state.repair) { renderIdle(dev); return; }
    result.classList.add("is-ready");
    var price = findPrice(dev.id, state.model, state.repair);
    var repairLabel = P.repairs[state.repair] || state.repair;
    var isService = SERVICES.indexOf(state.repair) >= 0;

    // lowercase the first letter, but keep acronyms like "HDMI"
    var nice = /^[A-Z]{2}/.test(repairLabel) ? repairLabel : repairLabel.charAt(0).toLowerCase() + repairLabel.slice(1);
    var pl = partLabel();
    result.appendChild(el("h3", "quote-title", state.model + ": " + nice + (pl ? " (" + pl + ")" : "")));

    var amt = el("p", "quote-amount"), small = el("p", "quote-note");
    if (price && price.from != null) {
      amt.innerHTML = "<small class=\"quote-est\">Estimated price</small>" + (price.to && price.to !== price.from
        ? money(price.from) + " <span>to</span> " + money(price.to)
        : price.to ? money(price.from) : "<span>From</span> " + money(price.from));
      small.textContent = (price.note ? price.note + ". " : "") +
        (partOptions() ? "Depends on the part you choose. " : "") + "We confirm your exact price before we start, and the quote is free.";
    } else if (state.repair === "sell") {
      amt.textContent = "Get an offer";
      small.textContent = "Tell us the model and its condition, and we'll get back to you with an offer.";
    } else {
      amt.textContent = "Free quote";
      var tr = P.typicalRange;
      var showRange = tr && (P.noRange || []).indexOf(state.repair) < 0;
      small.textContent = showRange
        ? "Most repairs run " + money(tr.from) + " to " + money(tr.to) + ", depending on the model and parts. Send us the details for an exact price."
        : "Every quote is free. Send us the details or walk in, and we'll confirm your exact price before we start.";
    }
    result.appendChild(amt);
    result.appendChild(small);

    // What's included (only facts the owner confirmed)
    var inc = [];
    if (!isService) inc.push("90-day technical warranty");
    if (state.repair !== "sell") {
      inc.push(PHONES.indexOf(dev.id) >= 0 && QUICK.indexOf(state.repair) >= 0 ? "Same day, about 30 min" : "Time given up front");
    }
    inc.push("Walk-ins welcome");
    if (state.repair !== "sell") inc.push("$5–$10 discounts");
    result.appendChild(inclList(inc));
    var s = statusLine();
    if (s) result.appendChild(s);

    var q = new URLSearchParams({ device: dev.id, model: state.model, repair: state.repair });
    if (state.part && state.part !== "unsure") q.set("part", state.part);
    var actions = el("div", "quote-actions");
    var book = el("a", "btn btn-primary", state.repair === "sell" ? "Request an offer" : "Get my free quote");
    book.href = state.repair === "sell" ? "buy-sell.html#offer" : "book.html?" + q.toString();
    var call = el("a", "btn btn-ghost", "Call " + (C.phoneDisplay || ""));
    call.href = C.phoneHref || "tel:+13348490404";
    actions.appendChild(book);
    if (state.repair !== "sell") {
      var appt = el("a", "btn btn-ghost", "Book a time");
      appt.href = "appointment.html?" + q.toString();
      actions.appendChild(appt);
    }
    actions.appendChild(call);
    result.appendChild(actions);

    result.appendChild(sendBox(dev, repairLabel));
    result.appendChild(shareRow());

    history.replaceState(null, "", "?" + q.toString());
  }

  /* ---------- "Have us call you with the exact price" ---------- */
  function digits(v) { var d = v.replace(/\D/g, ""); return d.length === 11 && d[0] === "1" ? d.slice(1) : d; }
  function fmtPhone(v) {
    var d = digits(v).slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return "(" + d.slice(0, 3) + ") " + d.slice(3);
    return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
  }

  function sendBox(dev, repairLabel) {
    var box = el("details", "quote-send");
    box.appendChild(el("summary", "", state.repair === "sell" ? "Have us call you with an offer" : "Have us call you with the exact price"));
    var loadedAt = Date.now();
    var form = el("form", "quote-send-form");
    form.noValidate = true;
    form.innerHTML =
      '<p class="quote-send-for"></p>' +
      '<div class="qs-row">' +
        '<label><span>Name</span><input name="name" autocomplete="name" required></label>' +
        '<label><span>Phone</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(334) 555-0123" required></label>' +
      '</div>' +
      '<input name="_honey" tabindex="-1" autocomplete="off" class="visually-hidden" aria-hidden="true">' +
      '<p class="qs-msg" role="status" hidden></p>' +
      '<button class="btn btn-primary" type="submit">Send</button>';
    form.querySelector(".quote-send-for").textContent = state.model + " · " + repairLabel + (partLabel() ? " · " + partLabel() : "");
    var name = form.elements.name, phone = form.elements.phone, msg = form.querySelector(".qs-msg"), btn = form.querySelector("button");
    phone.addEventListener("input", function () {
      if (phone.selectionStart === phone.value.length) phone.value = fmtPhone(phone.value);
    });
    function say(t) { msg.innerHTML = t; msg.hidden = !t; }
    var snap = { device: dev.label, model: state.model, repair: repairLabel, part: partLabel(), link: location.href };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (name.value.trim().length < 2) { say("Enter your name."); name.focus(); return; }
      if (digits(phone.value).length !== 10) { say("Enter a 10-digit phone number."); phone.focus(); return; }
      if (form.elements._honey.value || Date.now() - loadedAt < 2000) { done(); return; }
      btn.disabled = true; btn.textContent = "Sending…"; say("");
      fetch(C.form.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: name.value.trim(), phone: fmtPhone(phone.value),
          device: snap.device, model: snap.model, repair: snap.repair, part_quality: snap.part || (partOptions() ? "Not sure" : undefined),
          request: "Please call me with the exact price", quote_link: snap.link,
          _subject: "Price request: " + snap.model + " " + snap.repair + " (" + name.value.trim() + ")",
          _template: "table", _captcha: "false", _honey: ""
        })
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!(res.ok && (data.success === true || data.success === "true"))) throw new Error(data.message || "HTTP " + res.status);
        });
      }).then(done).catch(function (err) {
        if (window.console) console.warn("Price request failed:", err && err.message);
        say("That didn’t send. Try again, or call <a href=\"" + (C.phoneHref || "tel:+13348490404") + "\">" + (C.phoneDisplay || "(334) 849-0404") + "</a>.");
      }).then(function () { btn.disabled = false; btn.textContent = "Send"; });
    });
    function done() {
      var first = name.value.trim().split(/\s+/)[0];
      var ph = fmtPhone(phone.value);
      form.innerHTML = "";
      var ok = el("p", "qs-done");
      ok.innerHTML = CHECK;
      ok.appendChild(document.createTextNode("Thanks" + (first ? ", " + first : "") + ". We’ll call " + ph + " with your price."));
      form.appendChild(ok);
    }
    box.appendChild(form);
    box.addEventListener("toggle", function () { if (box.open && form.elements.name) form.elements.name.focus(); });
    return box;
  }

  /* ---------- Share or copy this quote ---------- */
  function shareRow() {
    var b = el("button", "quote-share");
    b.type = "button";
    var canShare = !!navigator.share && narrow.matches;
    b.innerHTML = SVG + '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg><span>' + (canShare ? "Share this quote" : "Copy link to this quote") + "</span>";
    b.addEventListener("click", function () {
      var url = location.href;
      if (canShare) { navigator.share({ title: "Fixit4U repair quote", url: url }).catch(function () {}); return; }
      var label = b.querySelector("span");
      var ok = function () { label.textContent = "Link copied"; setTimeout(function () { label.textContent = "Copy link to this quote"; }, 2200); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok, function () { window.prompt("Copy this link:", url); });
      else window.prompt("Copy this link:", url);
    });
    return b;
  }

  function revealResult() {
    if (!narrow.matches || !result.classList.contains("is-ready")) return;
    result.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  // after a shortcut, send focus to the first step still to do
  function focusNext() {
    if (result.classList.contains("is-ready")) { revealResult(); return; }
    var target = !state.device ? devWrap.querySelector("input")
      : !state.model ? (findInput.offsetParent && !narrow.matches ? findInput : modelList.querySelector(".chip:not([hidden]) input"))
      : repWrap.querySelector("input");
    if (target) target.focus({ preventScroll: true });
    var step = target && target.closest(".q-step");
    if (step) step.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }

  /* ---------- Set the tool to a device / repair / model ---------- */
  function choose(device, repair, model) {
    var same = device && device === state.device;
    state.device = device && deviceById(device) ? device : null;
    state.model = same || model ? (model || state.model) : "";
    if (repair && P.repairs[repair]) state.repair = repair;
    devWrap.querySelectorAll("input").forEach(function (r) { r.checked = r.value === state.device; });
    fillModels(); fillRepairs(); fillParts(); render();
  }

  devWrap.addEventListener("change", function (e) { state.device = e.target.value; state.model = ""; fillModels(); fillRepairs(); fillParts(); render(); });
  modelList.addEventListener("change", function (e) { pickModel(e.target.value); });
  repWrap.addEventListener("change", function (e) { state.repair = e.target.value; fillParts(); render(); revealResult(); });
  partList.addEventListener("change", function (e) { state.part = e.target.value; render(); revealResult(); });
  findInput.addEventListener("input", filterModels);
  findInput.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    // closest match = shortest name, so "15 pro" picks "iPhone 15 Pro", not "Pro Max"
    var first = [].slice.call(modelList.querySelectorAll(".chip:not([hidden]) input"))
      .sort(function (a, b) { return a.value.length - b.value.length; })[0];
    if (first) { first.checked = true; pickModel(first.value); }
  });
  function pickModel(m) {
    state.model = m;
    state.series = seriesOf(state.device, m) || state.series;
    fillParts(); render(); revealResult();
  }

  // Popular repairs: one tap fills the tool; show "from $X" where priced
  document.querySelectorAll("[data-pick]").forEach(function (a) {
    var p = a.getAttribute("data-pick").split("|");
    if (p[0]) {
      var pr = p[2] ? findPrice(p[0], p[2], p[1]) : null;
      var lo = pr && pr.from != null ? pr.from : lowest(p[0], p[1]);
      if (lo != null) a.appendChild(el("span", "p", "from " + money(lo)));
    }
    a.addEventListener("click", function (e) {
      e.preventDefault();
      choose(p[0], p[1], p[2]);
      document.querySelectorAll("[data-pick]").forEach(function (x) { x.setAttribute("aria-current", String(x === a)); });
      focusNext();
    });
  });

  // Preselect from URL (?device=iphone&model=...&repair=screen)
  var params = new URLSearchParams(location.search);
  state.part = params.get("part") || "";
  choose(params.get("device"), params.get("repair"), params.get("model"));
})();
