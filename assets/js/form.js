/* Fixit4U — free quote form (book.html) and appointment form (appointment.html)
   Order: device → repair (+ part quality) → problem → visit → contact.
   Sends to the endpoint in config.js (FormSubmit -> business inbox). */
(function () {
  "use strict";
  var form = document.getElementById("quote-form");
  if (!form) return;
  var C = window.FIXIT || {};
  var P = window.FIXIT_PRICING || { repairs: {}, devices: [] };
  var H = window.FIXIT_HOURS;
  var loadedAt = Date.now();
  function $(s) { return form.querySelector(s); }

  var f = {
    name: form.elements.name,
    phone: form.elements.phone,
    email: form.elements.email,
    problem: form.elements.problem,
    date: form.elements.date,
    time: form.elements.time,
    honey: form.elements._honey
  };
  var devWrap = $("[data-bk-devices]"), modelsBox = $("[data-bk-models]"), modelSel = $("[data-bk-model]");
  var repWrap = $("[data-bk-repairs]"), repHint = $("[data-bk-repair-hint]");
  var partsBox = $("[data-bk-parts]"), partList = $("[data-bk-part-list]");
  var deviceValue = $("[data-bk-device-value]");
  var whenBox = $("[data-bk-when]"), visitHint = $("[data-bk-visit-hint]"), emailBox = $("[data-bk-email]");
  var statusBox = document.getElementById("form-status");
  var submitBtn = form.querySelector("[type=submit]");
  var successBox = document.getElementById("form-success");

  var state = { device: null, model: "", repair: null, part: "" };

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function deviceById(id) { return P.devices.find(function (d) { return d.id === id; }); }
  function chip(name, value, label, checked) {
    var id = "bk-" + name + "-" + value;
    var wrap = el("span", "chip");
    var input = document.createElement("input");
    input.type = "radio"; input.name = "bk_" + name; input.id = id; input.value = value;
    if (checked) input.checked = true;
    var lab = el("label", "", label); lab.htmlFor = id;
    wrap.appendChild(input); wrap.appendChild(lab);
    return wrap;
  }
  function radioVal(name) { var r = form.querySelector("input[name=" + name + "]:checked"); return r ? r.value : ""; }

  /* ---------- 1. Device + model (dropdown, grouped by series) ---------- */
  P.devices.forEach(function (d) { devWrap.appendChild(chip("device", d.id, d.label, false)); });

  function seriesOf(devId, m) {
    var x;
    if (devId === "iphone") { if (/Air/.test(m)) return "iPhone 17 series"; x = m.match(/iPhone (\d+)/); return x && +x[1] >= 11 ? "iPhone " + x[1] + " series" : "Older iPhones"; }
    if (devId === "samsung") { x = m.match(/Galaxy (S\d+)/); return x ? "Galaxy " + x[1] + " series" : "Fold, Flip, A-series & more"; }
    return "";
  }
  function fillModels() {
    var dev = deviceById(state.device);
    modelSel.innerHTML = "";
    if (!dev) { modelsBox.hidden = true; state.model = ""; return; }
    modelsBox.hidden = false;
    if (dev.models.indexOf(state.model) < 0) state.model = dev.models.length === 1 ? dev.models[0] : "";
    var ph = el("option", "", "Choose your model"); ph.value = ""; modelSel.appendChild(ph);
    var group = null, last = null;
    dev.models.forEach(function (m) {
      var s = seriesOf(dev.id, m);
      if (s && s !== last) { group = el("optgroup"); group.label = s; modelSel.appendChild(group); last = s; }
      var o = el("option", "", m); o.value = m;
      (s ? group : modelSel).appendChild(o);
    });
    modelSel.value = state.model;
    modelsBox.hidden = dev.models.length === 1;
  }
  function deviceLabel() {
    var dev = deviceById(state.device);
    if (!dev) return "";
    var m = state.model;
    if (!m) return dev.label;
    if (dev.id === "samsung" && m.indexOf("Galaxy") === 0) return "Samsung " + m;
    if (/not sure|^Other/i.test(m)) return dev.label + " (" + m.toLowerCase() + ")";
    return m;
  }

  /* Step 1 folds to one line once the device and model are chosen */
  var step1 = devWrap.closest(".bk-step");
  var picked = el("div", "bk-picked");
  picked.hidden = true;
  picked.innerHTML = '<span class="bk-picked-ic" aria-hidden="true">✓</span><b data-bk-picked></b>';
  var change = el("button", "bk-change", "Change");
  change.type = "button";
  change.addEventListener("click", function () {
    step1.classList.remove("is-folded"); picked.hidden = true;
    var c = devWrap.querySelector("input:checked") || devWrap.querySelector("input"); if (c) c.focus();
  });
  picked.appendChild(change);
  step1.querySelector("legend").insertAdjacentElement("afterend", picked);
  function foldStep1() {
    var dev = deviceById(state.device);
    var ready = dev && (state.model || dev.models.length === 1);
    step1.classList.toggle("is-folded", !!ready);
    picked.hidden = !ready;
    if (ready) picked.querySelector("[data-bk-picked]").textContent = deviceLabel();
  }
  /* ---------- 2. Repair + part quality ---------- */
  function fillRepairs() {
    var dev = deviceById(state.device);
    repWrap.innerHTML = "";
    repHint.hidden = !!dev;
    if (!dev) return;
    if (dev.repairs.indexOf(state.repair) < 0) state.repair = null;
    dev.repairs.forEach(function (r, i) {
      var c = chip("repair", r, P.repairs[r] || r, r === state.repair);
      if (i >= 6 && r !== state.repair) { c.hidden = true; c.classList.add("is-extra"); }
      repWrap.appendChild(c);
    });
    var extra = repWrap.querySelectorAll(".is-extra").length;
    if (extra) {
      var more = el("button", "bk-more", "More repairs (" + extra + ")");
      more.type = "button";
      more.addEventListener("click", function () {
        repWrap.querySelectorAll(".is-extra").forEach(function (c) { c.hidden = false; });
        more.remove();
      });
      repWrap.appendChild(more);
    }
  }
  function partOptions() {
    var opts = P.partChoices ? P.partChoices(state.device, state.model, state.repair) : null;
    return opts ? opts.concat([{ id: "unsure", label: "Not sure" }]) : null;
  }
  function fillParts() {
    var opts = partOptions();
    partList.innerHTML = "";
    if (!opts) { partsBox.hidden = true; return; }
    if (!opts.some(function (o) { return o.id === state.part; })) state.part = "unsure";
    opts.forEach(function (o) { partList.appendChild(chip("part", o.id, o.label, o.id === state.part)); });
    partsBox.querySelector(".q-parts-label").textContent = state.repair === "screen" ? "Screen quality" : "Part quality";
    partsBox.hidden = false;
  }
  function partLabel() {
    var o = (partOptions() || []).filter(function (x) { return x.id === state.part; })[0];
    return o ? o.label : "";
  }
  function sync() { deviceValue.value = deviceLabel(); }

  /* ---------- Live estimate + summary line ---------- */
  var estEl = $("[data-bk-estimate]"), sumEl = $("[data-bk-summary]");
  function money(n) { return "$" + Number(n).toLocaleString("en-US"); }
  function estimateText() {
    if (!state.device || !state.repair) return null;
    var pr = P.prices || {}, p = null;
    if (state.model) p = pr[state.device + "|" + state.model + "|" + state.repair] || pr[state.device + "|*|" + state.repair];
    if (p && p.from != null) return p.to && p.to !== p.from ? money(p.from) + "–" + money(p.to) : money(p.from);
    if (!state.model) {
      var lo = null;
      Object.keys(pr).forEach(function (k) { var x = k.split("|"); if (x[0] === state.device && x[2] === state.repair && (lo === null || pr[k].from < lo)) lo = pr[k].from; });
      if (lo !== null) return "from " + money(lo);
    }
    return "";
  }
  function updateExtras() {
    var est = estimateText();
    if (estEl) {
      estEl.hidden = est === null;
      if (est) estEl.innerHTML = "<b>Estimated: " + est + "</b> · we confirm your exact price before we start.";
      else if (est === "") estEl.innerHTML = "<b>Free quote</b> · we'll send you a price for this repair.";
    }
    if (sumEl) {
      if (!state.device || !state.repair) { sumEl.hidden = true; return; }
      var bits = [deviceLabel(), P.repairs[state.repair] || state.repair];
      var pl = partLabel(); if (pl && pl !== "Not sure") bits.push(pl);
      if (visitVal() === "Book a time" && f.date && f.date.value) {
        bits.push(new Date(f.date.value + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
          (f.time && f.time.value && f.time.value !== "Any time" ? " at " + f.time.value : ""));
      }
      bits.push("reply by " + radioVal("reply"));
      var d = radioVal("discount"); if (d && d !== "None") bits.push(d + " discount");
      sumEl.innerHTML = "<span>You're sending:</span> " + bits.map(function (b) { return "<b>" + b.replace(/[<>&]/g, "") + "</b>"; }).join(" · ");
      sumEl.hidden = false;
    }
  }
  form.addEventListener("change", function () { setTimeout(updateExtras, 0); });

  devWrap.addEventListener("change", function (e) {
    state.device = e.target.value; state.model = "";
    fillModels(); fillRepairs(); fillParts(); sync(); clearErr("device");
    if (!modelsBox.hidden) modelSel.focus();
  });
  modelSel.addEventListener("change", function () { state.model = modelSel.value; fillParts(); sync(); clearErr("model"); foldStep1(); });
  repWrap.addEventListener("change", function (e) { state.repair = e.target.value; fillParts(); clearErr("repair"); });
  partList.addEventListener("change", function (e) { state.part = e.target.value; });
  /* ---------- 4. Visit ---------- */
  var HINTS = {
    "Walk in": "No appointment needed. Walk in any time we're open.",
    "Book a time": "Pick a day and time. We'll confirm it with you.",
    "Just send me a quote": "We'll send your quote first. Come in whenever you're ready."
  };
  // The quote page and the appointment page fix the visit type with data-visit
  function visitVal() { return form.getAttribute("data-visit") || radioVal("visit"); }
  function syncVisit() {
    var v = visitVal();
    if (whenBox) whenBox.hidden = v !== "Book a time";
    if (visitHint) visitHint.textContent = HINTS[v] || "";
  }
  form.querySelectorAll("input[name=visit]").forEach(function (r) { r.addEventListener("change", syncVisit); });

  /* ---------- 5. Reply method ---------- */
  function syncReply() {
    var byEmail = radioVal("reply") === "Email";
    emailBox.hidden = !byEmail;
    f.email.required = byEmail;
    if (byEmail && document.activeElement && document.activeElement.name === "reply") f.email.focus();
  }
  form.querySelectorAll("input[name=reply]").forEach(function (r) { r.addEventListener("change", syncReply); });

  /* ---------- Prefill from the quote tool (?device=&model=&repair=&part=) ---------- */
  var qs = new URLSearchParams(location.search);
  if (qs.get("device") && deviceById(qs.get("device"))) {
    state.device = qs.get("device");
    var dr = devWrap.querySelector('input[value="' + state.device + '"]'); if (dr) dr.checked = true;
    var pm = qs.get("model"); if (pm && deviceById(state.device).models.indexOf(pm) >= 0) state.model = pm;
  }
  if (qs.get("repair") && P.repairs[qs.get("repair")]) state.repair = qs.get("repair");
  if (qs.get("part")) state.part = qs.get("part");
  var DISC = { student: "bk-d1", military: "bk-d2", returning: "bk-d4", follow: "bk-d5" };
  if (qs.get("discount") && DISC[qs.get("discount")]) {
    var dc = document.getElementById(DISC[qs.get("discount")]);
    if (dc) { dc.checked = true; var dd = form.querySelector("[data-bk-disc]"); if (dd) dd.open = true; }
  }
  if (qs.get("note")) { f.problem.value = qs.get("note"); f.problem.closest("details").open = true; }
  if (qs.get("visit") === "book") { var vb = form.querySelector("#bk-v2"); if (vb) vb.checked = true; }
  fillModels(); fillRepairs(); fillParts(); sync(); syncVisit(); syncReply(); updateExtras(); foldStep1();

  /* ---------- Date + time limits from business hours ---------- */
  function shopToday() {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: C.timeZone || "America/Chicago" }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  var today = shopToday();
  var maxD = new Date(today + "T12:00:00"); maxD.setDate(maxD.getDate() + 60);
  if (f.date) { f.date.min = today; f.date.max = maxD.toISOString().slice(0, 10); }
  function dayInfo(iso) {
    if (!iso) return null;
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return null;
    var name = d.toLocaleDateString("en-US", { weekday: "long" });
    return (C.hours || []).find(function (h) { return h.day === name; }) || null;
  }
  function fillTimes() {
    if (!f.date || !f.time) return;
    var info = dayInfo(f.date.value), keep = f.time.value;
    f.time.innerHTML = "";
    var any = el("option", "", info && info.open ? "Any time that day" : "Any time"); any.value = "Any time";
    f.time.appendChild(any);
    if (info && info.open && H) {
      var start = H.toMin(info.open), end = H.toMin(info.close);
      var nowMins = f.date.value === today ? H.shopNow().mins : -1;
      for (var m = start; m <= end - 60; m += 60) {
        if (m <= nowMins) continue;
        var t = String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
        var o = el("option", "", H.fmtTime(t)); o.value = H.fmtTime(t);
        f.time.appendChild(o);
      }
    }
    if ([].some.call(f.time.options, function (o) { return o.value === keep; })) f.time.value = keep;
  }
  fillTimes();

  /* ---------- Phone formatting ---------- */
  function digits(v) { var d = v.replace(/\D/g, ""); return d.length === 11 && d[0] === "1" ? d.slice(1) : d; }
  function fmtPhone(v) {
    var d = digits(v).slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return "(" + d.slice(0, 3) + ") " + d.slice(3);
    return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
  }
  f.phone.addEventListener("input", function () {
    if (f.phone.selectionStart === f.phone.value.length) f.phone.value = fmtPhone(f.phone.value);
  });

  /* ---------- Validation ---------- */
  var rules = {
    device: { el: devWrap.querySelector("input"), err: "bk-device-error", test: function () { return state.device ? "" : "Pick your device."; } },
    model: { el: modelSel, err: "bk-model-error", test: function () { return !state.device || state.model ? "" : "Choose your model, or “Older or not sure”."; } },
    repair: { el: null, err: "bk-repair-error", test: function () { return state.repair ? "" : "Pick what needs fixing, or “Diagnostic / not sure”."; } },
    date: { el: f.date, err: "f-date-error", test: function () {
      if (!f.date || visitVal() !== "Book a time") return "";
      var v = f.date.value;
      if (!v) return "Pick a day for your visit.";
      if (v < f.date.min) return "Pick today or a later date.";
      if (v > f.date.max) return "Pick a date within the next 60 days.";
      var info = dayInfo(v);
      if (info && !info.open) return "We're closed on " + info.day + "s. Pick another day.";
      return "";
    } },
    name: { el: f.name, err: "f-name-error", test: function () { return f.name.value.trim().length >= 2 ? "" : "Enter your name."; } },
    phone: { el: f.phone, err: "f-phone-error", test: function () { return digits(f.phone.value).length === 10 ? "" : "Enter a 10-digit phone number, like (334) 555-0123."; } },
    email: { el: f.email, err: "f-email-error", test: function () {
      var v = f.email.value.trim();
      if (radioVal("reply") !== "Email") return "";
      if (!v) return "Enter your email so we can reply by email.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Check your email address. It should look like name@example.com.";
    } }
  };
  function check(key, show) {
    var r = rules[key], msg = r.test(), e = document.getElementById(r.err);
    if (show) {
      if (r.el) r.el.setAttribute("aria-invalid", msg ? "true" : "false");
      if (e) { e.textContent = msg; e.hidden = !msg; }
    }
    return msg;
  }
  function clearErr(key) { var e = document.getElementById(rules[key].err); if (e) { e.hidden = true; e.textContent = ""; } }
  ["name", "phone", "email"].forEach(function (k) {
    var fld = rules[k].el;
    fld.addEventListener("blur", function () { if (fld.value) check(k, true); });
    fld.addEventListener("input", function () { if (fld.getAttribute("aria-invalid") === "true") check(k, true); });
  });
  if (f.date) f.date.addEventListener("change", function () { check("date", true); fillTimes(); });

  function showStatus(kind, html) {
    statusBox.className = "form-status is-" + kind;
    statusBox.innerHTML = html;
    statusBox.hidden = false;
  }

  /* ---------- Submit ---------- */
  var sending = false;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;
    statusBox.hidden = true;

    var firstBad = null;
    Object.keys(rules).forEach(function (k) {
      if (check(k, true) && !firstBad) {
        firstBad = rules[k].el || document.getElementById(rules[k].err).closest("fieldset").querySelector("input");
      }
    });
    if (firstBad) {
      showStatus("error", "<p>Some details need fixing before we can send your request.</p>");
      firstBad.focus();
      return;
    }
    if (f.honey.value || Date.now() - loadedAt < 2500) { done(); return; }

    var visit = visitVal(), reply = radioVal("reply");
    var repairLabel = P.repairs[state.repair] || state.repair;
    var part = partLabel();
    var email = radioVal("reply") === "Email" ? f.email.value.trim() : "";
    var payload = {
      name: f.name.value.trim(),
      phone: fmtPhone(f.phone.value),
      reply_by: reply,
      email: email || "Not given",
      device: deviceLabel(),
      repair: repairLabel,
      part_quality: part || undefined,
      notes: f.problem.value.trim() || "None",
      visit: visit,
      estimated_price: estimateText() || "Free quote",
      discount: radioVal("discount") || "None",
      preferred_date: visit === "Book a time" ? f.date.value : undefined,
      preferred_time: visit === "Book a time" ? (f.time.value || "Any time") : undefined,
      _subject: "Repair request: " + deviceLabel() + " (" + repairLabel + (part && part !== "Not sure" ? ", " + part : "") + ") · " +
        visit + " · reply by " + reply + (radioVal("discount") && radioVal("discount") !== "None" ? " · discount: " + radioVal("discount") : "") + " · " + f.name.value.trim(),
      _template: "table",
      _captcha: "false",
      _honey: ""
    };
    if (email) {
      payload._replyto = email;
      // Confirmation email to the customer (only when they gave an email)
      payload._autoresponse = "Thanks for contacting Fixit4U! We received your request for " + deviceLabel() +
        " (" + repairLabel + ") and will reply by " + reply.toLowerCase() + " during business hours with your free quote. " +
        "Walk-ins are welcome, and most repairs are done the same day. Need it sooner? Call " + (C.phoneDisplay || "(334) 849-0404") +
        ". Fixit4U, 1111 S College St, Ste 200 A, Auburn, AL 36832.";
    } else {
      delete payload.email;
      payload.email_given = "No";
    }

    sending = true;
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-busy", "true");
    var originalLabel = submitBtn.textContent;
    submitBtn.textContent = "Sending…";
    var ctrl = "AbortController" in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);

    fetch(C.form.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!(res.ok && (data.success === true || data.success === "true"))) throw new Error((data && data.message) || ("HTTP " + res.status));
        });
      })
      .then(done)
      .catch(function (err) {
        if (window.console) console.warn("Form send failed:", err && err.message);
        var phone = C.phoneDisplay || "(334) 849-0404";
        showStatus("error",
          "<p><strong>Your request didn’t go through.</strong> Nothing was lost: your details are still in the form. " +
          "Try sending again, or call us at <a href=\"" + (C.phoneHref || "tel:+13348490404") + "\">" + phone + "</a>" +
          " or email <a href=\"mailto:" + C.email + "\">" + C.email + "</a>.</p>");
        statusBox.focus();
      })
      .then(function () {
        clearTimeout(timer);
        sending = false;
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
        submitBtn.textContent = originalLabel;
      });
  });

  function done() {
    var first = (f.name.value.trim().split(/\s+/)[0] || "");
    var nameEl = successBox.querySelector("[data-success-name]");
    if (nameEl) nameEl.textContent = first ? ", " + first : "";
    var devEl = successBox.querySelector("[data-success-device]");
    if (devEl) devEl.textContent = deviceLabel() || "your device";
    var reply = radioVal("reply"), ph = fmtPhone(f.phone.value), email = reply === "Email" ? f.email.value.trim() : "";
    var msg = reply === "Text" ? "We’ll text " + ph + " with your free quote during business hours."
      : reply === "Call" ? "We’ll call " + ph + " with your free quote during business hours."
      : "We’ll email " + email + " with your free quote during business hours.";
    if (visitVal() === "Book a time" && f.date && f.date.value) {
      var when = new Date(f.date.value + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) +
        (f.time && f.time.value && f.time.value !== "Any time" ? " at " + f.time.value : "");
      var how = reply === "Text" ? "text " + ph : reply === "Call" ? "call " + ph : "email " + email;
      msg = "We’ll " + how + " to confirm your visit on " + when + ".";
    } else if (visitVal() === "Walk in") {
      msg += " Walk in any time we’re open.";
    }
    if (email) msg += " A confirmation is on its way to your inbox.";
    var replyEl = successBox.querySelector("[data-success-reply]");
    if (replyEl) replyEl.textContent = msg;
    var recap = successBox.querySelector("[data-success-recap]");
    if (recap) {
      var rows = [["Device", deviceLabel()], ["Repair", P.repairs[state.repair] || state.repair]];
      var pl = partLabel(); if (pl && pl !== "Not sure") rows.push(["Part", pl]);
      var est = estimateText(); rows.push(["Estimate", est || "Free quote"]);
      var dsc = radioVal("discount"); if (dsc && dsc !== "None") rows.push(["Discount", dsc]);
      recap.innerHTML = rows.map(function (r) { return "<li><span>" + r[0] + "</span><b>" + String(r[1]).replace(/[<>&]/g, "") + "</b></li>"; }).join("");
    }
    var appt = successBox.querySelector("[data-success-appt]");
    if (appt) {
      var aq = new URLSearchParams();
      if (state.device) aq.set("device", state.device);
      if (state.model) aq.set("model", state.model);
      if (state.repair) aq.set("repair", state.repair);
      if (state.part && state.part !== "unsure") aq.set("part", state.part);
      appt.href = "appointment.html" + (aq.toString() ? "?" + aq.toString() : "");
    }
    form.hidden = true;
    statusBox.hidden = true;
    successBox.hidden = false;
    var h = successBox.querySelector("h2");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
  }
})();
