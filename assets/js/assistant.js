/* Fixit4U — website assistant (no AI service, no cost).
   Answers from the site's own data only: estimated prices (pricing-data.js),
   hours (config.js) and owner-confirmed facts below. Anything it can't answer
   is handed to a person: call, text, free quote or appointment. */
(function () {
  "use strict";
  var C = window.FIXIT || {};
  var me = document.currentScript;
  var ver = me && me.src.indexOf("?") > -1 ? me.src.slice(me.src.indexOf("?")) : "";
  var PHONE = C.phoneDisplay || "(334) 849-0404", TEL = C.phoneHref || "tel:+13348490404", SMS = "sms:+13348490404";
  var DIRECTIONS = C.directionsUrl || "https://www.google.com/maps/dir/?api=1&destination=1111+S+College+St+Ste+200+A%2C+Auburn%2C+AL+36832";
  var ctx = { device: null, model: "", repair: null };
  var P = null, opened = false;

  /* ---------- Small helpers ---------- */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function money(n) { return "$" + Number(n).toLocaleString("en-US"); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function loadPricing(cb) {
    if (window.FIXIT_PRICING) { P = window.FIXIT_PRICING; cb(); return; }
    var s = document.createElement("script");
    s.src = "assets/js/pricing-data.js" + ver;
    s.onload = function () { P = window.FIXIT_PRICING || null; cb(); };
    s.onerror = function () { cb(); };
    document.head.appendChild(s);
  }

  /* ---------- Hours ---------- */
  function statusLine() {
    var H = window.FIXIT_HOURS;
    if (!H || !C.hours) return "We're open Tuesday to Saturday 9 AM–7 PM and Sunday 10 AM–5 PM. Closed Mondays.";
    var hours = C.hours, now = H.shopNow();
    var idx = hours.findIndex(function (h) { return h.day === now.day; });
    var t = hours[idx];
    if (t && t.open && now.mins >= H.toMin(t.open) && now.mins < H.toMin(t.close)) return "We're open now until " + H.fmtTime(t.close) + ". Walk in any time.";
    if (t && t.open && now.mins < H.toMin(t.open)) return "We're closed right now. We open today at " + H.fmtTime(t.open) + ".";
    for (var k = 1; k <= 7; k++) {
      var n = hours[(idx + k) % 7];
      if (n.open) return "We're closed right now. We open " + (k === 1 ? "tomorrow" : n.day) + " at " + H.fmtTime(n.open) + ".";
    }
    return "";
  }
  var HOURS_TEXT = "Tuesday–Saturday 9 AM–7 PM · Sunday 10 AM–5 PM · Monday closed.";

  /* ---------- Understanding the question ---------- */
  function norm(s) { return " " + s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9+]+/g, " ").replace(/\s+/g, " ").trim() + " "; }
  function has(t, re) { return re.test(t); }

  var REPAIRS = [
    ["back-glass", /back glass|backglass|back cover|rear glass|back panel|glass on the back/],
    ["hdmi", /hdmi|no picture|no signal|no display on tv/],
    ["controller", /controller|joy con|joycon|stick drift|drift/],
    ["screen", /screen|display|lcd|oled|crack|shatter|broken glass|touch|lines|black screen|glass/],
    ["battery", /battery|drain|dies fast|dying|wont hold|swollen|battery health/],
    ["charging-port", /charg|port|lightning|usb c|usbc|wont charge/],
    ["camera", /camera|lens|blurry/],
    ["speaker", /speaker|microphone| mic |cant hear|no sound|muffled/],
    ["water", /water|wet|liquid|spill|toilet|pool|rain/],
    ["keyboard", /keyboard|trackpad|touchpad|keys/],
    ["overheating", /overheat|too hot|loud fan|fan noise/],
    ["power", /wont turn on|not turning on|no power|dead|wont power/],
    ["software", /slow|frozen|freez|wont boot|virus|stuck on/],
    ["unlock", /unlock|carrier lock|sim lock|network lock/],
    ["data-transfer", /data transfer|transfer my|move my|move data|backup|back up/]
  ];

  function iphoneKey(m) { return m.toLowerCase().replace("iphone ", "").replace(" / ", " ").replace(/[()]/g, "").replace(" 2nd or 3rd gen", ""); }
  function findModel(t, device) {
    var dev = P && P.devices.find(function (d) { return d.id === device; });
    if (!dev) return "";
    var best = "", bestLen = 0;
    dev.models.forEach(function (m) {
      var keys = [];
      if (device === "iphone") {
        var k = iphoneKey(m); keys.push(k);
        if (/6s 6/.test(k)) keys.push("6s", "6");
        if (/6s plus 6 plus/.test(k)) keys.push("6s plus", "6 plus");
        if (k === "se") keys.push("se 2", "se 3", "se");
      } else if (device === "samsung") {
        var g = m.toLowerCase().replace("galaxy ", "");
        if (/^s\d/.test(g)) { keys.push(g, g.replace("+", " plus"), g.replace("+", "+ ")); }
        if (/z fold/.test(g)) keys.push("fold", "z fold");
        if (/z flip/.test(g)) keys.push("flip", "z flip");
        if (/a-series/.test(g)) keys.push("a series", "a10", "a11", "a12", "a13", "a14", "a15", "a16", "a20", "a21", "a22", "a23", "a24", "a25", "a32", "a33", "a34", "a35", "a42", "a50", "a51", "a52", "a53", "a54", "a55", "a71");
        if (/note/.test(g)) keys.push("note");
      } else {
        keys.push(m.toLowerCase().replace(/[()]/g, "").replace(/ \/ /g, " "));
        if (m === "Google Pixel") keys.push("pixel", "google");
        if (m === "Motorola") keys.push("moto", "motorola");
        if (m === "iPad (standard)") keys.push("ipad");
        if (m === "Samsung Galaxy Tab") keys.push("galaxy tab", "tab s", "tab a");
        if (m === "Amazon Fire tablet") keys.push("fire", "kindle");
        if (m === "MacBook Air") keys.push("macbook air");
        if (m === "MacBook Pro") keys.push("macbook pro", "macbook");
        if (m === "Windows laptop") keys.push("windows", "hp", "dell", "lenovo", "asus", "acer", "surface");
        if (m === "Chromebook") keys.push("chromebook");
        if (m === "PlayStation 5") keys.push("ps5", "playstation 5", "ps 5");
        if (m === "PlayStation 4") keys.push("ps4", "playstation 4", "ps 4");
        if (m === "Xbox Series X or S") keys.push("xbox series", "series x", "series s");
        if (m === "Xbox One") keys.push("xbox one");
        if (m === "Nintendo Switch / Switch OLED") keys.push("switch", "switch oled");
        if (m === "Nintendo Switch Lite") keys.push("switch lite");
        if (m === "Nintendo Switch 2") keys.push("switch 2");
        if (m === "Apple Watch") keys.push("apple watch");
        if (m === "Samsung Galaxy Watch") keys.push("galaxy watch");
        if (m === "Google Pixel Watch") keys.push("pixel watch");
      }
      keys.forEach(function (k) {
        k = norm(k).trim();
        if (k && t.indexOf(" " + k + " ") > -1 && k.length > bestLen) { best = m; bestLen = k.length; }
      });
    });
    return best;
  }
  function findDevice(t) {
    if (has(t, / ipad /)) return "tablet";
    if (has(t, / watch /)) return "watch";
    if (has(t, /iphone| ip \d|apple phone/)) return "iphone";
    if (has(t, /macbook|laptop|chromebook|notebook|computer/)) return "laptop";
    if (has(t, /ps5|ps4|playstation|xbox|switch|console|nintendo/)) return "console";
    if (has(t, /galaxy tab|tablet|kindle| fire /)) return "tablet";
    if (has(t, /samsung|galaxy| s2\d | fold | flip | note | a\d\d /)) return "samsung";
    if (has(t, /pixel|google|motorola| moto |oneplus| lg | tcl |android/)) return "phone-other";
    return null;
  }
  function findRepair(t) {
    for (var i = 0; i < REPAIRS.length; i++) if (REPAIRS[i][1].test(t)) return REPAIRS[i][0];
    return null;
  }

  /* ---------- Answers ---------- */
  function quoteLink(label, extra) {
    var q = new URLSearchParams();
    if (ctx.device) q.set("device", ctx.device);
    if (ctx.model) q.set("model", ctx.model);
    if (ctx.repair) q.set("repair", ctx.repair);
    return { label: label, href: (extra || "book.html") + (q.toString() ? "?" + q.toString() : "") };
  }
  var HUMAN = [{ label: "Call " + PHONE, href: TEL }, { label: "Text us", href: SMS, cls: "ca-text" }, { label: "Get a free quote", href: "book.html" }];

  function priceAnswer() {
    var dev = P.devices.find(function (d) { return d.id === ctx.device; });
    var rl = P.repairs[ctx.repair] || "that repair";
    var repairName = /^[A-Z]{2}/.test(rl) ? rl : rl.toLowerCase();
    if (dev && dev.repairs.indexOf(ctx.repair) < 0) {
      return { html: "We don't list <b>" + esc(repairName) + "</b> for " + esc(dev.label) + ", but tell us what's wrong and we'll take a look.", links: [quoteLink("Get a free quote"), HUMAN[0]] };
    }
    if (!ctx.model && dev && dev.models.length > 1) {
      var lo = null;
      Object.keys(P.prices || {}).forEach(function (k) { var x = k.split("|"); if (x[0] === ctx.device && x[2] === ctx.repair && (lo === null || P.prices[k].from < lo)) lo = P.prices[k].from; });
      var lead = lo !== null ? dev.label + " " + esc(repairName) + " starts at an estimated <b>" + money(lo) + "</b>. " : "";
      return { html: lead + "Which model do you have? Type it, like <i>" + esc(dev.models[Math.min(4, dev.models.length - 1)]) + "</i>.", chips: dev.models.slice(0, 4).concat(dev.models.length > 4 ? [] : []) };
    }
    var p = P.prices[ctx.device + "|" + ctx.model + "|" + ctx.repair] || P.prices[ctx.device + "|*|" + ctx.repair];
    var name = (ctx.model || (dev ? dev.label : "your device")).replace(/\s*\((any|A15[^)]*)\)/, "");
    var choices = P.partChoices ? P.partChoices(ctx.device, ctx.model, ctx.repair) : null;
    var partNote = choices ? " The price depends on the part you choose: " + choices.map(function (c) { return c.label; }).join(", ") + "." : "";
    var html;
    if (p && p.from != null) {
      var range = p.to && p.to !== p.from ? money(p.from) + "–" + money(p.to) : money(p.from);
      html = "<b>" + esc(name) + " " + esc(repairName) + "</b>: estimated <b>" + range + "</b>." + esc(partNote) +
        " We confirm your exact price before we start, and it comes with a 90-day technical warranty.";
    } else {
      html = "We don't have a listed estimate for <b>" + esc(name) + " " + esc(repairName) + "</b> yet, but quotes are free. Send the details and we'll get back to you with a price.";
    }
    return { html: html, links: [quoteLink("Get a free quote"), quoteLink("Book a time", "appointment.html"), HUMAN[0]] };
  }

  function answer(raw) {
    var t = norm(raw);
    // device / model / repair memory
    var dev = findDevice(t), rep = findRepair(t);
    if (dev && dev !== ctx.device) { ctx.device = dev; ctx.model = ""; }
    if (ctx.device) { var m = findModel(t, ctx.device); if (m) ctx.model = m; }
    if (!dev && !ctx.device) {
      // a bare model like "15 pro max" or "s24 ultra"
      ["iphone", "samsung"].some(function (d) { var mm = findModel(t, d); if (mm) { ctx.device = d; ctx.model = mm; return true; } return false; });
    }
    if (rep) ctx.repair = rep;

    // a clear repair question ("iPhone 15 screen", "where can I fix my ps5 hdmi") goes straight to the price
    var aboutSelling = has(t, /sell|trade in|tradein|cash for|buy my/);
    if (rep && ctx.device && P && !aboutSelling) return priceAnswer();

    // topics that are not about a specific repair
    if (has(t, / (hi|hello|hey|yo|salam|good (morning|afternoon|evening)) /) && t.trim().split(" ").length <= 3)
      return { html: "Hi! I can help with estimated prices, hours, directions, discounts and selling your phone. What do you need?", chips: START };
    if (has(t, /thank|thanks|thx/)) return { html: "You're welcome! Anything else?", chips: START };
    if (has(t, /open|hour|close|closing|today|sunday|monday|weekend|what time/) && !rep)
      return { html: esc(statusLine()) + "<br><b>Hours:</b> " + HOURS_TEXT, links: [{ label: "Get directions", href: DIRECTIONS, ext: true }, HUMAN[0]] };
    if (has(t, /where|address|location|located|direction|parking|park|find you|map/))
      return { html: "We're at <b>1111 S College St, Suite 200 A, Auburn, AL 36832</b>, next to BenchMark Physical Therapy. Parking is right out front, and walk-ins are welcome.", links: [{ label: "Get directions", href: DIRECTIONS, ext: true }, { label: "Contact page", href: "contact.html" }] };
    if (has(t, /phone number|call you|contact|email|text you|reach you|talk to (a )?(person|human|someone)/))
      return { html: "Call or text <b>" + PHONE + "</b>, or email <b>" + esc(C.email || "info@thefixit4you.com") + "</b>. Walk-ins are welcome too.", links: HUMAN.slice(0, 2).concat([{ label: "Send a message", href: "contact.html#msg-title" }]) };
    if (has(t, /discount|deal|coupon|promo|student|military|veteran|first responder|cheaper|sale/))
      return { html: "Save <b>$5–$10</b> with a student or military/first responder ID, as a returning customer, or by following us on Facebook or Instagram. Repair bundles and multi-device visits save too, screen repairs come with a free or half-price screen protector, and trade-ins earn store credit.", links: [{ label: "See all discounts", href: "discounts.html" }, { label: "Get a free quote", href: "book.html" }] };
    if (has(t, /sell|trade in|tradein|trade-in|buy my|cash for|how much (is|for) my (old )?(phone|device)|zelle/))
      return { html: "Yes, we buy phones, tablets, laptops, consoles and watches, even cracked, locked or dead ones. We pay <b>cash or Zelle</b>, or give trade-in credit. Bring the device and a <b>photo ID</b>.", links: [{ label: "Get a free offer", href: "buy-sell.html#offer" }, HUMAN[0]] };
    if (has(t, /buy a phone|phones for sale|in stock|used phone|refurbished|new phone/))
      return { html: "We sell new, used and refurbished phones with a <b>30-day technical warranty</b>. Stock changes often, so tell us what you want and we'll call you when it's in.", links: [{ label: "Find me a phone", href: "buy-sell.html#buy" }, HUMAN[0]] };
    if (has(t, /warranty|guarantee/))
      return { html: "Repairs come with a <b>90-day technical warranty</b>. Phones we sell come with a 30-day technical warranty.", chips: ["Check a price", "Are you open?"] };
    if (has(t, /how long|wait|same day|how fast|turnaround|minutes|today/) && !has(t, /price|cost|how much/))
      return { html: "Most phone repairs are done the <b>same day, usually in about 30 minutes</b>. For tablets, laptops and consoles we tell you the time up front.", links: [{ label: "Book a time", href: "appointment.html" }, { label: "Get a free quote", href: "book.html" }] };
    if (has(t, /appointment| book | booking |schedule|reserve|walk in|walkin/))
      return { html: "No appointment needed, walk-ins are welcome. If you'd like to pick a time, you can book one online.", links: [{ label: "Make an appointment", href: "appointment.html" }, { label: "Get directions", href: DIRECTIONS, ext: true }] };
    if (has(t, /genuine|original|aftermarket|oem|oled vs|lcd vs|difference|which part|quality/))
      return { html: "<b>Genuine</b> parts are made by the phone's brand, like Apple or Samsung. <b>Aftermarket</b> parts come from other makers and usually cost less. For iPhone screens you can choose aftermarket LCD, aftermarket OLED or genuine Apple. We'll help you pick.", chips: ["Check a price"] };
    if (has(t, /bangla|bengali|language|speak/))
      return { html: "Yes, we speak English and বাংলা (Bangla) in the shop." };
    if (has(t, /what do you (fix|repair)|which devices|do you (fix|repair)|services/) && !rep && !dev)
      return { html: "We repair phones, tablets, laptops, game consoles and smartwatches: screens, batteries, charging ports, cameras, back glass, water damage and more. We also do data transfer and phone unlocking.", links: [{ label: "All services", href: "services.html" }], chips: ["Check a price"] };
    if (has(t, /check a price|price|cost|how much|quote|estimate/) && !ctx.repair && !ctx.device)
      return { html: "Sure! What device is it?", chips: ["iPhone", "Samsung", "iPad", "Laptop", "PS5", "Other"] };

    // repair / price questions
    if (ctx.device && !ctx.repair) {
      var d = P && P.devices.find(function (x) { return x.id === ctx.device; });
      return { html: "Got it" + (ctx.model ? ", " + esc(ctx.model) : d ? ", " + esc(d.label) : "") + ". What needs fixing?", chips: (d ? d.repairs.slice(0, 6) : []).map(function (r) { return P.repairs[r]; }) };
    }
    if (ctx.repair && !ctx.device) {
      return { html: "What device is it for?", chips: ["iPhone", "Samsung", "iPad", "Laptop", "PS5", "Other"] };
    }
    if (ctx.device && ctx.repair && P) return priceAnswer();

    if (has(t, / other /)) return { html: "No problem. Tell us what it is and what's wrong, and we'll send a free quote.", links: [{ label: "Get a free quote", href: "book.html?device=other" }, HUMAN[0]] };
    return { html: "I'm not sure about that one. A person at the shop can help right away:", links: HUMAN };
  }

  var START = ["Check a price", "Are you open?", "Where are you?", "Discounts", "Sell my phone", "Book a time"];

  /* ---------- Chat window ---------- */
  var launcher = el("button", "fx-chat-btn");
  launcher.type = "button";
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "fx-chat");
  launcher.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg><span>Ask us</span>';

  var panel = el("section", "fx-chat");
  panel.id = "fx-chat";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Fixit4U assistant");
  panel.innerHTML =
    '<header class="fx-chat-head"><div><b>Fixit4U Assistant</b><small data-chat-status></small></div>' +
    '<button type="button" class="fx-chat-x" aria-label="Close chat">×</button></header>' +
    '<div class="fx-chat-log" role="log" aria-live="polite"></div>' +
    '<form class="fx-chat-form"><label for="fx-chat-in" class="visually-hidden">Ask a question</label>' +
    '<input id="fx-chat-in" autocomplete="off" maxlength="200" placeholder="Ask about prices, hours, discounts…">' +
    '<button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg></button></form>' +
    '<p class="fx-chat-note">Automated assistant · prices are estimates · chats are saved so we can help you. <a href="privacy.html#chat">Privacy</a></p>';
  document.body.appendChild(panel);
  document.body.appendChild(launcher);

  var log = panel.querySelector(".fx-chat-log"), input = panel.querySelector("input"), form = panel.querySelector("form");

  /* ---------- Saving the conversation (emailed to the shop when the visitor leaves) ---------- */
  var talk = [], asked = 0, sentUpTo = 0, sends = 0;
  function plain(html) { var d = document.createElement("div"); d.innerHTML = String(html).replace(/<br\s*\/?>/gi, " "); return (d.textContent || "").replace(/\s+/g, " ").trim(); }
  function shopTime() {
    try { return new Date().toLocaleString("en-US", { timeZone: C.timeZone || "America/Chicago", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
    catch (e) { return new Date().toString(); }
  }
  function chatPayload() {
    var first = (talk.find(function (x) { return x.who === "Visitor"; }) || {}).text || "";
    var data = {
      _subject: (sends ? "Website chat (continued): " : "Website chat: ") + first.slice(0, 60) + " · " + asked + " question" + (asked === 1 ? "" : "s"),
      _template: "table", _captcha: "false",
      "Page": location.pathname.replace(/^\//, "") || "index.html",
      "Time (Auburn)": shopTime(),
      "Device": /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Phone" : (/iPad|Tablet/i.test(navigator.userAgent) ? "Tablet" : "Computer"),
      "Came from": document.referrer ? document.referrer.replace(/^https?:\/\//, "").slice(0, 80) : "Typed the address / bookmark",
      "Looking at": [ctx.model || ctx.device || "", ctx.repair ? (P && P.repairs[ctx.repair]) || ctx.repair : ""].filter(Boolean).join(" · ") || "—"
    };
    var n = 0;
    talk.slice(0, 60).forEach(function (x) {
      if (x.who === "Visitor") n++;
      if (!n) return; // skip the greeting
      data[(n < 10 ? "0" : "") + n + (x.who === "Visitor" ? " Visitor" : " Assistant")] = x.text.slice(0, 600);
    });
    return data;
  }
  function sendChat() {
    if (C.chatEmail === false || !C.form || !C.form.endpoint || asked === 0 || talk.length === sentUpTo) return;
    var body = new URLSearchParams(chatPayload());
    sentUpTo = talk.length; sends++;
    if (/^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname)) { if (window.console) console.debug("[chat email, not sent on preview]", Object.fromEntries(body)); return; }
    try { fetch(C.form.endpoint, { method: "POST", body: body, keepalive: true, headers: { "Accept": "application/json" } }).catch(function () {}); }
    catch (e) { if (navigator.sendBeacon) navigator.sendBeacon(C.form.endpoint, body); }
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") sendChat(); });
  window.addEventListener("pagehide", sendChat);

  function addUser(text) { var b = el("div", "fx-msg is-user", text); log.appendChild(b); scroll(); talk.push({ who: "Visitor", text: text }); asked++; if (window.fxTrack) fxTrack("chat_question", { page: location.pathname }); }
  function addBot(a) {
    var wrap = el("div", "fx-msg is-bot");
    wrap.innerHTML = a.html;
    talk.push({ who: "Assistant", text: plain(a.html) + (a.links && a.links.length ? " [" + a.links.map(function (l) { return l.label; }).join(" | ") + "]" : "") });
    if (a.links && a.links.length) {
      var row = el("div", "fx-links");
      a.links.forEach(function (l) {
        var x = el("a", "fx-link" + (l.cls ? " " + l.cls : ""), l.label);
        x.href = l.href;
        if (l.ext) { x.target = "_blank"; x.rel = "noopener"; }
        row.appendChild(x);
      });
      wrap.appendChild(row);
    }
    log.appendChild(wrap);
    if (a.chips && a.chips.length) {
      var chips = el("div", "fx-chips");
      a.chips.forEach(function (c) {
        var b = el("button", "fx-chip", c); b.type = "button";
        b.addEventListener("click", function () { chips.remove(); send(c); });
        chips.appendChild(b);
      });
      log.appendChild(chips);
    }
    scroll();
  }
  function scroll() { log.scrollTop = log.scrollHeight; }
  function send(text) {
    text = (text || "").trim();
    if (!text) return;
    addUser(text);
    var typing = el("div", "fx-msg is-bot is-typing", "…");
    log.appendChild(typing); scroll();
    setTimeout(function () {
      typing.remove();
      var map = { "Are you open?": "are you open", "Where are you?": "where are you", "Discounts": "discounts", "Sell my phone": "sell my phone", "Book a time": "book an appointment", "Check a price": "check a price", "PS5": "ps5", "Other": "other device" };
      addBot(answer(map[text] || text));
    }, 350);
  }

  function open() {
    loadPricing(function () {
      panel.hidden = false;
      launcher.setAttribute("aria-expanded", "true");
      document.body.classList.add("chat-open");
      panel.querySelector("[data-chat-status]").textContent = statusLine().replace("We're ", "").replace(". Walk in any time.", "");
      if (!opened) {
        opened = true;
        if (window.fxTrack) fxTrack("chat_open", { page: location.pathname });
        addBot({ html: "Hi! I'm the Fixit4U assistant. Ask me for an estimated repair price, our hours, directions or discounts.", chips: START });
      }
      setTimeout(function () { input.focus(); }, 50);
    });
  }
  function close() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    document.body.classList.remove("chat-open");
    launcher.focus();
  }
  launcher.addEventListener("click", function () { if (panel.hidden) open(); else close(); });
  panel.querySelector(".fx-chat-x").addEventListener("click", close);
  panel.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; send(v); });

  // expose for testing
  window.FIXIT_ASSISTANT = { ask: function (q) { return answer(q); }, reset: function () { ctx = { device: null, model: "", repair: null }; }, load: loadPricing, chatEmail: chatPayload };
})();
