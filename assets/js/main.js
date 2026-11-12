/* Fixit4U — shared page behaviour: menu, hours, open status, reviews */
(function () {
  "use strict";
  var C = window.FIXIT || {};

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("nav-open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 1080px)").addEventListener("change", function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* ---------- Current page in nav ---------- */
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a[href]").forEach(function (a) {
    if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page");
  });

  /* ---------- Header state on scroll ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Hours ---------- */
  var hours = C.hours || [];

  function fmtTime(hhmm) {
    var p = hhmm.split(":"), h = +p[0], m = +p[1];
    var suffix = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 || 12;
    return h12 + (m ? ":" + String(m).padStart(2, "0") : "") + " " + suffix;
  }
  function fmtRange(d) {
    return d.open ? fmtTime(d.open) + " – " + fmtTime(d.close) : "Closed";
  }
  function toMin(hhmm) { var p = hhmm.split(":"); return +p[0] * 60 + +p[1]; }

  // Current day name and minutes in the shop's time zone
  function shopNow() {
    var parts = {};
    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone: C.timeZone || "America/Chicago",
        weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) {
      var d = new Date();
      parts = { weekday: d.toLocaleDateString("en-US", { weekday: "long" }), hour: d.getHours(), minute: d.getMinutes() };
    }
    return { day: parts.weekday, mins: (+parts.hour % 24) * 60 + +parts.minute };
  }
  window.FIXIT_HOURS = { fmtTime: fmtTime, fmtRange: fmtRange, toMin: toMin, shopNow: shopNow };

  var now = shopNow();
  var todayIdx = hours.findIndex(function (h) { return h.day === now.day; });

  document.querySelectorAll("[data-hours]").forEach(function (el) {
    var table = document.createElement("table");
    table.className = "hours-table";
    var cap = el.getAttribute("data-hours-caption");
    if (cap) {
      var c = document.createElement("caption");
      c.className = "visually-hidden";
      c.textContent = cap;
      table.appendChild(c);
    }
    var tb = document.createElement("tbody");
    // rows: one per day, or grouped ("Tuesday – Saturday") when data-hours-grouped is set
    var rows = hours.map(function (h, i) { return { label: h.day, h: h, today: i === todayIdx }; });
    if (el.hasAttribute("data-hours-grouped")) {
      var groups = [];
      hours.forEach(function (h, i) {
        var g = groups[groups.length - 1];
        if (g && fmtRange(g.h) === fmtRange(h)) { g.last = h.day; g.today = g.today || i === todayIdx; }
        else groups.push({ first: h.day, last: h.day, h: h, today: i === todayIdx });
      });
      groups.sort(function (a, b) { return (a.h.open ? 0 : 1) - (b.h.open ? 0 : 1); }); // closed days last
      rows = groups.map(function (g) { return { label: g.first === g.last ? g.first : g.first + " – " + g.last, h: g.h, today: g.today }; });
      table.classList.add("hours-grouped");
    }
    rows.forEach(function (row) {
      var h = row.h;
      var tr = document.createElement("tr");
      if (row.today) tr.className = "is-today";
      if (!h.open) tr.classList.add("is-closed");
      var th = document.createElement("th");
      th.scope = "row";
      th.textContent = row.label;
      if (row.today) {
        var tag = document.createElement("span");
        tag.className = "today-tag";
        tag.textContent = "Today";
        th.appendChild(document.createTextNode(" "));
        th.appendChild(tag);
      }
      var td = document.createElement("td");
      td.textContent = fmtRange(h);
      tr.appendChild(th);
      tr.appendChild(td);
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    el.innerHTML = "";
    el.appendChild(table);
  });

  // "Open now until 7 PM" / "Opens tomorrow at 9 AM"
  function openStatus() {
    if (todayIdx < 0) return null;
    var t = hours[todayIdx];
    if (t.open) {
      var o = toMin(t.open), c = toMin(t.close);
      if (now.mins >= o && now.mins < c) return { open: true, text: "Open now until " + fmtTime(t.close) };
      if (now.mins < o) return { open: false, text: "Closed now. Opens today at " + fmtTime(t.open) };
    }
    for (var k = 1; k <= 7; k++) {
      var n = hours[(todayIdx + k) % 7];
      if (n.open) {
        var when = k === 1 ? "tomorrow" : n.day;
        return { open: false, text: "Closed now. Opens " + when + " at " + fmtTime(n.open) };
      }
    }
    return null;
  }
  var status = openStatus();
  document.querySelectorAll("[data-open-status]").forEach(function (el) {
    if (!status) { el.hidden = true; return; }
    el.querySelector("[data-open-text]").textContent = status.text;
    el.classList.add(status.open ? "is-open" : "is-closed");
    el.hidden = false;
  });

  // "Open today 9 AM – 7 PM" / "Closed today"
  document.querySelectorAll("[data-today-hours]").forEach(function (el) {
    if (todayIdx < 0) return;
    var t = hours[todayIdx];
    el.textContent = t.open ? "Open today " + fmtRange(t) : "Closed today";
  });


  /* ---------- Call buttons ----------
     Phones dial straight away. On a computer, a tel: link often does
     nothing, so show the number with "Copy" and "Call from this device". */
  var isPhone = window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 1024px)").matches;
  var callDialog = null;
  function buildCallDialog() {
    var d = document.createElement("dialog");
    d.className = "call-dialog";
    d.setAttribute("aria-labelledby", "call-dialog-title");
    d.innerHTML =
      '<button class="call-close" type="button" aria-label="Close">×</button>' +
      '<p class="call-kicker">Call the shop</p>' +
      '<h2 id="call-dialog-title"><a data-direct-call href="' + (C.phoneHref || "tel:+13348490404") + '">' + (C.phoneDisplay || "(334) 849-0404") + "</a></h2>" +
      '<p class="call-status" data-call-status></p>' +
      '<p class="call-help">Dial this number from your phone, or use a calling app on this computer.</p>' +
      '<div class="btn-row">' +
        '<button class="btn btn-primary" type="button" data-copy-phone>Copy number</button>' +
        '<a class="btn btn-ghost" data-direct-call href="' + (C.phoneHref || "tel:+13348490404") + '">Call from this computer</a>' +
      "</div>" +
      '<p class="call-copied" data-copied role="status" aria-live="polite"></p>';
    document.body.appendChild(d);
    d.querySelector(".call-close").addEventListener("click", function () { d.close(); });
    d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
    d.querySelector("[data-copy-phone]").addEventListener("click", function () {
      var out = d.querySelector("[data-copied]");
      var text = C.phoneDisplay || "(334) 849-0404";
      var done = function () { out.textContent = "Number copied."; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { out.textContent = "Select the number above to copy it."; });
      } else { out.textContent = "Select the number above to copy it."; }
    });
    return d;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (!a || a.hasAttribute("data-direct-call") || isPhone) return;
    if (typeof HTMLDialogElement === "undefined") return; // very old browser: let the link work normally
    e.preventDefault();
    if (!callDialog) callDialog = buildCallDialog();
    var st = callDialog.querySelector("[data-call-status]");
    var s = typeof openStatus === "function" ? openStatus() : null;
    st.textContent = s ? s.text : "";
    callDialog.querySelector("[data-copied]").textContent = "";
    callDialog.showModal();
  });

  /* ---------- Rating + review links (footer is on every page) ---------- */
  var RV = C.reviews || {};
  if (RV.summary) {
    document.querySelectorAll("[data-rating]").forEach(function (el) { el.textContent = Number(RV.summary.rating).toFixed(1); });
    document.querySelectorAll("[data-rating-count]").forEach(function (el) { el.textContent = Number(RV.summary.count).toLocaleString("en-US"); });
  }
  document.querySelectorAll("[data-review-google]").forEach(function (a) { if (RV.googleUrl) a.href = RV.googleUrl; });
  document.querySelectorAll("[data-review-write]").forEach(function (a) { if (RV.writeReviewUrl || RV.googleUrl) a.href = RV.writeReviewUrl || RV.googleUrl; });

  /* ---------- Back to top ---------- */
  document.querySelectorAll("[data-to-top]").forEach(function (b) {
    b.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      var skip = document.querySelector(".brand"); if (skip) skip.focus({ preventScroll: true });
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
