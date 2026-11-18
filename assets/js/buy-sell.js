/* Fixit4U — Buy & Sell page: offer / find-a-phone forms, checklist, section tabs */
(function () {
  "use strict";
  var C = window.FIXIT || {};

  function digits(v) { var d = v.replace(/\D/g, ""); return d.length === 11 && d[0] === "1" ? d.slice(1) : d; }
  function fmtPhone(v) {
    var d = digits(v).slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return "(" + d.slice(0, 3) + ") " + d.slice(3);
    return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
  }

  /* ---- Lead forms: sends every filled field to the shop inbox ---- */
  document.querySelectorAll("form[data-lead]").forEach(function (form) {
    var wrap = form.parentElement;
    var done = wrap.querySelector("[data-lead-done]");
    var status = form.querySelector("[data-lead-status]");
    var btn = form.querySelector("[type=submit]");
    var loadedAt = Date.now();
    var phone = form.elements.phone;

    var rules = {
      model: function (v) { return v.trim().length >= 2 ? "" : "Tell us the model."; },
      name: function (v) { return v.trim().length >= 2 ? "" : "Enter your name."; },
      phone: function (v) { return digits(v).length === 10 ? "" : "Enter a 10-digit phone number."; },
      // optional: an all-number entry must be a 15-digit IMEI; letters mean a serial number
      imei: function (v) { var s = v.replace(/[\s-]/g, ""); return !s || /[a-z]/i.test(s) || /^\d{15}$/.test(s) ? "" : "An IMEI is 15 digits. Check it and try again."; }
    };
    function check(f, show) {
      var msg = rules[f.name](f.value);
      if (show) {
        var err = document.getElementById(f.id + "-err");
        f.setAttribute("aria-invalid", msg ? "true" : "false");
        if (err) { err.textContent = msg; err.hidden = !msg; }
      }
      return msg;
    }
    var required = Object.keys(rules).map(function (k) { return form.elements[k]; }).filter(Boolean);
    required.forEach(function (f) {
      f.addEventListener("blur", function () { if (f.value) check(f, true); });
      f.addEventListener("input", function () { if (f.getAttribute("aria-invalid") === "true") check(f, true); });
    });
    phone.addEventListener("input", function () {
      if (phone.selectionStart === phone.value.length) phone.value = fmtPhone(phone.value);
    });

    function say(html) { status.innerHTML = html; status.hidden = !html; status.classList.toggle("is-error", !!html); }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = null;
      required.forEach(function (f) { if (check(f, true) && !bad) bad = f; });
      if (bad) { var more = bad.closest("details"); if (more) more.open = true; bad.focus(); return; }
      if (form.elements._honey.value || Date.now() - loadedAt < 2500) { finish(); return; }

      var data = {};
      [].forEach.call(form.elements, function (f) {
        if (!f.name || f.name === "_honey" || f.type === "submit") return;
        if ((f.type === "radio" || f.type === "checkbox") && !f.checked) return;
        if (!f.value.trim()) return;
        var v = f.name === "phone" ? fmtPhone(f.value) : f.value.trim();
        data[f.name] = f.type === "checkbox" && data[f.name] ? data[f.name] + ", " + v : v;
      });
      var subject = form.getAttribute("data-subject") || "Website request";
      data._subject = subject + ": " + (data.model || "") + " (" + data.name + ")";
      data._template = "table"; data._captcha = "false"; data._honey = "";

      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = "Sending…";
      say("");
      fetch(C.form.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (d) {
          if (!(res.ok && (d.success === true || d.success === "true"))) throw new Error(d.message || "HTTP " + res.status);
        });
      }).then(finish).catch(function (err) {
        if (window.console) console.warn("Send failed:", err && err.message);
        say("That didn’t send. Try again, or call us at <a href=\"" + (C.phoneHref || "tel:+13348490404") + "\">" + (C.phoneDisplay || "(334) 849-0404") + "</a>.");
      }).then(function () { btn.disabled = false; btn.textContent = label; });
    });

    function finish() {
      var first = form.elements.name.value.trim().split(/\s+/)[0] || "";
      var ph = fmtPhone(phone.value);
      var model = form.elements.model.value.trim();
      done.querySelector("[data-lead-done-title]").textContent = first ? "Thanks, " + first + "." : "Thanks.";
      var t = done.querySelector("[data-lead-done-text]");
      t.textContent = form.getAttribute("data-subject") === "Stock question"
        ? "We’ll call " + (ph || "you") + " about the " + (model.replace(/ \(.*\)$/, "") || "item") + "."
        : form.getAttribute("data-subject") === "Phone request"
        ? (/^In stock: /.test(model)
          ? "We’ll call " + (ph || "you") + " about the " + model.replace(/^In stock: /, "").replace(/ \(.*\)$/, "") + "."
          : "We’ll call " + (ph || "you") + " when we have " + (model || "your phone") + ".")
        : "We’ll call " + (ph || "you") + " with an offer for your " + (model || "device") + ". Bring it in with a photo ID.";
      form.hidden = true;
      done.hidden = false;
      done.focus();
      form.reset();
      required.forEach(function (f) { f.removeAttribute("aria-invalid"); });
    }
    done.querySelector("[data-lead-again]").addEventListener("click", function () {
      done.hidden = true; form.hidden = false; loadedAt = Date.now(); form.elements.model.focus();
    });
  });

  /* ---- "In stock": devices from the Google Sheet in config.js (stockSheet),
         or from for-sale.js when no sheet is set or it can't be reached ---- */
  var stock = document.querySelector("[data-stock]");
  if (stock) {
    var items = [];
    // ?stock=demo previews the layout with sample devices (not real stock)
    var demoAsked = /[?&]stock=demo\b/.test(location.search), demo = false;
    var SAMPLE = [
      { type: "phone", model: "iPhone 13", specs: "128 GB", color: "Midnight", condition: "Used", battery: "89%", price: "$349" },
      { type: "phone", model: "Galaxy S22", specs: "128 GB", color: "Phantom Black", condition: "Refurbished", price: "" },
      { type: "tablet", model: "iPad 9th gen", specs: "64 GB · Wi-Fi", color: "Space Gray", condition: "Refurbished", price: "$219" },
      { type: "laptop", model: "MacBook Air M1", specs: "8 GB RAM · 256 GB SSD", color: "Silver", condition: "Used", battery: "", price: "" }
    ];
    var TYPES = { phone: "Phones", tablet: "Tablets", laptop: "Laptops" };
    var ICONS = {
      phone: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
      tablet: '<rect x="4" y="2" width="16" height="20" rx="2.5"/><path d="M11 18h2"/>',
      laptop: '<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>'
    };
    var esc = function (s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var typeOf = function (p) { var s = String(p.type || "").toLowerCase(); return /tablet|ipad/.test(s) ? "tablet" : /laptop|macbook|computer/.test(s) ? "laptop" : "phone"; };
    var tel = C.phoneHref || "tel:+13348490404";
    var callSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
    var stockList = stock.querySelector("[data-stock-list]");
    var empty = stock.querySelector("[data-stock-empty]");
    var chips = [].slice.call(stock.querySelectorAll("[data-stock-filter]"));

    function render() {
    stockList.innerHTML = items.map(function (p, i) {
      var t = typeOf(p);
      var title = p.model;
      var meta = [p.specs || p.storage, p.color, p.battery ? "Battery " + p.battery : ""].filter(Boolean).join(" · ");
      return '<li class="bs-phone" data-type="' + t + '">' +
        '<div class="bs-phone-img">' + (p.photo
          ? '<img src="' + esc(p.photo) + '" alt="' + esc(p.model + (p.color ? " in " + p.color : "")) + '" loading="lazy">'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[t] + "</svg>") +
        (p.condition ? '<span class="bs-phone-tag">' + esc(p.condition) + "</span>" : "") +
        (demo ? '<span class="bs-phone-tag is-sample">Sample</span>' : "") + "</div>" +
        '<div class="bs-phone-body">' +
        "<h3>" + esc(title) + "</h3>" +
        (meta ? '<p class="bs-phone-meta">' + esc(meta) + "</p>" : "") +
        '<p class="bs-phone-price">' + (p.price ? esc(p.price) : "Call for price") + "</p>" +
        '<p class="bs-phone-war">30-day technical warranty' + (t === "phone" ? "<br>Screen protector included" : "") + "</p>" +
        '<div class="bs-phone-act">' +
        '<button class="btn btn-primary btn-sm" type="button" data-ask="' + i + '">Ask about this ' + t + "</button>" +
        '<a class="btn btn-ghost btn-sm bs-phone-call" href="' + tel + '" aria-label="Call about the ' + esc(title) + '" title="Call ' + esc(C.phoneDisplay || "(334) 849-0404") + '">' + callSvg + "</a>" +
        "</div></div></li>";
    }).join("");

    var counts = { all: items.length };
    items.forEach(function (p) { var t = typeOf(p); counts[t] = (counts[t] || 0) + 1; });
    chips.forEach(function (c) { var n = c.querySelector("[data-count]"); if (n) n.textContent = counts[c.getAttribute("data-stock-filter")] || 0; });

    function show(type) {
      if (!TYPES[type]) type = "all";
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-stock-filter") === type)); });
      var shown = 0;
      [].forEach.call(stockList.children, function (li) { var on = type === "all" || li.getAttribute("data-type") === type; li.hidden = !on; if (on) shown++; });
      if (empty) {
        empty.hidden = shown > 0;
        var what = type === "all" ? "devices" : TYPES[type].toLowerCase();
        empty.querySelector("[data-empty-text]").textContent = "No " + what + " listed right now. Stock changes fast, so tell us what you want and we'll call you when it's in.";
      }
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var type = c.getAttribute("data-stock-filter");
        show(type);
        if (history.replaceState) history.replaceState(null, "", type === "all" ? location.pathname + (demo ? "?stock=demo" : "") : "?type=" + type + (demo ? "&stock=demo" : ""));
      });
    });
    var bar = stock.querySelector(".bs-stock-bar");
    if (bar) bar.hidden = !items.length;
    var qType = (location.search.match(/[?&]type=(\w+)/) || [])[1];
    show(qType || "all");
    stock.removeAttribute("aria-busy");
    }

    // "Ask about this ..." fills the question form and jumps to it
    stockList.addEventListener("click", function (e) {
      var b = e.target.closest("[data-ask]");
      if (!b) return;
      var p = items[+b.getAttribute("data-ask")];
      var form = document.querySelector('form[data-subject="Stock question"]');
      if (!form || !p) return;
      var doneBox = form.parentElement.querySelector("[data-lead-done]");
      if (doneBox && !doneBox.hidden) { doneBox.hidden = true; form.hidden = false; }
      form.elements.model.value = [p.model, p.specs || p.storage, p.color, p.condition].filter(Boolean).join(", ") + (p.price ? " (" + p.price + ")" : "");
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(function () { form.elements.name.focus({ preventScroll: true }); }, 450);
      if (window.fxTrack) window.fxTrack("stock_interest", { item_type: typeOf(p), item_model: p.model });
    });

    // a photo that won't load (wrong link, not shared) falls back to the device icon
    stockList.addEventListener("error", function (e) {
      var img = e.target;
      if (!img || img.tagName !== "IMG") return;
      var li = img.closest("li");
      var t = li ? li.getAttribute("data-type") : "phone";
      img.insertAdjacentHTML("afterend", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[t] || ICONS.phone) + "</svg>");
      img.remove();
    }, true);

    /* -- load the list -- */
    function begin(list) {
      items = (list || []).filter(function (p) { return p && p.model && !/^(sold|hide|hidden|no)$/i.test(String(p.status || "").trim()); });
      demo = !items.length && demoAsked;
      if (demo) items = SAMPLE;
      render();
    }
    // a CSV line parser that handles quotes, commas and line breaks inside cells
    function parseCSV(text) {
      var rows = [], row = [], cell = "", q = false;
      text = text.replace(/^﻿/, "");
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (q) {
          if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
          else cell += ch;
        } else if (ch === '"') q = true;
        else if (ch === ",") { row.push(cell); cell = ""; }
        else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
        else cell += ch;
      }
      if (cell || row.length) { row.push(cell); rows.push(row); }
      return rows;
    }
    // Sheet columns (any order, case doesn't matter): Type, Model, Specs, Color, Condition, Battery, Price, Photo, Status
    function fromSheet(text) {
      var rows = parseCSV(text).filter(function (r) { return r.some(function (c) { return c.trim(); }); });
      if (rows.length < 2) return [];
      var keys = rows[0].map(function (h) {
        h = h.trim().toLowerCase();
        return /^stor|^spec|memory/.test(h) ? "specs" : /^colou?r/.test(h) ? "color" : /^cond/.test(h) ? "condition" : /^batt/.test(h) ? "battery" : /^pric/.test(h) ? "price" : /^(photo|image|picture|pic)/.test(h) ? "photo" : /^(status|sold|show)/.test(h) ? "status" : /^(type|device|category)/.test(h) ? "type" : /^(model|name|item)/.test(h) ? "model" : h;
      });
      return rows.slice(1).map(function (r) {
        var o = {};
        keys.forEach(function (k, i) { o[k] = (r[i] || "").trim(); });
        if (/^\d+(\.\d+)?$/.test(o.price || "")) o.price = "$" + o.price;
        if (/^\d+(\.\d+)?$/.test(o.battery || "")) o.battery = Math.round(+o.battery <= 1 ? +o.battery * 100 : +o.battery) + "%";
        o.photo = photoUrl(o.photo);
        return o;
      });
    }
    // photo can be a Google Drive share link, a web link, or a file name in assets/img/stock/
    function photoUrl(v) {
      v = (v || "").trim();
      if (!v) return "";
      var id = (v.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/) || [])[1];
      if (id) return "https://drive.google.com/thumbnail?id=" + id + "&sz=w1000";
      if (/^https?:\/\//.test(v) || /^assets\//.test(v)) return v;
      return "assets/img/stock/" + v;
    }
    // accepts a "Publish to web" CSV link or a normal sheet link shared as "Anyone with the link"
    function sheetCsvUrl(u) {
      if (!u) return "";
      if (/output=csv|format=csv|tqx=out:csv/.test(u)) return u;
      var m = u.match(/\/spreadsheets\/d\/([\w-]{20,})/);
      if (m && m[1] !== "e") return "https://docs.google.com/spreadsheets/d/" + m[1] + "/gviz/tq?tqx=out:csv&headers=1" + ((u.match(/[#&?]gid=(\d+)/) || [])[1] ? "&gid=" + u.match(/[#&?]gid=(\d+)/)[1] : "");
      return u;
    }
    var sheet = sheetCsvUrl(C.stockSheet);
    if (sheet) {
      stock.setAttribute("aria-busy", "true");
      var ctl = "AbortController" in window ? new AbortController() : null;
      var tmr = setTimeout(function () { if (ctl) ctl.abort(); }, 8000);
      fetch(sheet + (sheet.indexOf("?") < 0 ? "?" : "&") + "t=" + Math.floor(Date.now() / 60000), { signal: ctl ? ctl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
        .then(function (txt) { if (/^\s*</.test(txt)) throw new Error("not CSV"); begin(fromSheet(txt)); })
        .catch(function (err) { if (window.console) console.warn("Stock sheet failed, using for-sale.js:", err && err.message); begin(window.FIXIT_STOCK); })
        .then(function () { clearTimeout(tmr); });
    } else {
      begin(window.FIXIT_STOCK);
    }
  }

  /* ---- "Before you sell" checklist ---- */
  var list = document.querySelector("[data-ready]");
  if (list) {
    var boxes = [].slice.call(list.querySelectorAll("input[type=checkbox]"));
    var count = document.querySelector("[data-ready-count]");
    var update = function () {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      count.textContent = n === boxes.length ? "All set to sell" : n + " of " + boxes.length + " ready";
      count.classList.toggle("is-done", n === boxes.length);
      boxes.forEach(function (b) { b.closest("li").classList.toggle("is-checked", b.checked); });
    };
    list.addEventListener("change", update);
    update();
  }

  /* ---- Section tabs: highlight the section on screen ---- */
  var tabs = [].slice.call(document.querySelectorAll("[data-bs-tab]"));
  if (tabs.length && "IntersectionObserver" in window) {
    var current = "";
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) current = en.target.id; });
      tabs.forEach(function (t) { t.setAttribute("aria-current", String(t.getAttribute("data-bs-tab") === current)); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    tabs.forEach(function (t) { var s = document.getElementById(t.getAttribute("data-bs-tab")); if (s) io.observe(s); });
  }
})();
