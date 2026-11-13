/* Fixit4U — homepage: fill "Popular repair prices" from pricing-data.js */
(function () {
  "use strict";
  var P = window.FIXIT_PRICING;
  var cards = document.querySelectorAll("[data-pp]");
  if (!P || !cards.length) return;
  var pr = P.prices || {};

  function money(n) { return "$" + Number(n).toLocaleString("en-US"); }
  // lowest "from" price for this device + repair, across every model
  function lowest(dev, repair) {
    var best = null;
    Object.keys(pr).forEach(function (k) {
      var p = k.split("|");
      if (p[0] === dev && p[2] === repair && pr[k].from != null && (best === null || pr[k].from < best)) best = pr[k].from;
    });
    return best;
  }

  var list = cards[0].closest("ul");
  var priced = [], unpriced = [];
  cards.forEach(function (a) {
    var k = a.getAttribute("data-pp").split("|");
    var lo = lowest(k[0], k[1]);
    var price = a.querySelector(".pp-price");
    if (lo != null) {
      price.innerHTML = "<small>Estimated from</small> " + money(lo);
      a.classList.add("is-priced");
      priced.push(a.parentNode);
    } else {
      price.textContent = "Free quote";
      unpriced.push(a.parentNode);
    }
  });
  // priced repairs first
  priced.concat(unpriced).forEach(function (li) { list.appendChild(li); });
})();

/* Hero phone lock screen: live Auburn time, date and open status */
(function () {
  "use strict";
  var timeEl = document.querySelector("[data-ph-time]");
  if (!timeEl) return;
  var C = window.FIXIT || {}, H = window.FIXIT_HOURS, hours = C.hours || [];
  var dateEl = document.querySelector("[data-ph-date]"), statusEl = document.querySelector("[data-ph-status]"), dot = document.querySelector("[data-ph-dot]");
  var tz = C.timeZone || "America/Chicago";
  function fmt(opts) { try { return new Date().toLocaleString("en-US", Object.assign({ timeZone: tz }, opts)); } catch (e) { return new Date().toLocaleString("en-US", opts); } }
  function status() {
    if (!H || !hours.length) return { text: "Walk-ins welcome", open: true };
    var now = H.shopNow(), idx = hours.findIndex(function (h) { return h.day === now.day; }), t = hours[idx];
    if (t && t.open && now.mins >= H.toMin(t.open) && now.mins < H.toMin(t.close)) return { text: "Open now · until " + H.fmtTime(t.close), open: true };
    if (t && t.open && now.mins < H.toMin(t.open)) return { text: "Opens today " + H.fmtTime(t.open), open: false };
    for (var k = 1; k <= 7; k++) {
      var n = hours[(idx + k) % 7];
      if (n && n.open) return { text: "Opens " + (k === 1 ? "tomorrow" : n.day.slice(0, 3)) + " " + H.fmtTime(n.open), open: false };
    }
    return { text: "Walk-ins welcome", open: true };
  }
  function tick() {
    timeEl.textContent = fmt({ hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?[AP]M$/i, "");
    if (dateEl) dateEl.textContent = fmt({ weekday: "long", month: "short", day: "numeric" }).toUpperCase();
    if (statusEl) {
      var s = status();
      statusEl.textContent = s.text;
      if (dot) {
        dot.setAttribute("fill", s.open ? "#3ddc84" : "#fcb040");
        try { var w = statusEl.getComputedTextLength(); dot.setAttribute("cx", (305 - w / 2 - 8).toFixed(1)); } catch (e) {}
      }
    }
  }
  tick();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(tick);
  setInterval(tick, 20000);
})();
