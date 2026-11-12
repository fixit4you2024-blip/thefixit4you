/* Fixit4U — Services page: search box, device filter, quick ideas */
(function () {
  "use strict";
  var search = document.querySelector("[data-svc-search]");
  if (!search) return;
  var cards = [].slice.call(document.querySelectorAll(".svc-card"));
  var groups = [].slice.call(document.querySelectorAll("[data-svc-group]"));
  var count = document.querySelector("[data-svc-count]");
  var status = document.querySelector("[data-svc-status]");
  var empty = document.querySelector("[data-svc-empty]");
  var clearBtn = document.querySelector("[data-svc-clear]");
  var resetBtn = document.querySelector("[data-svc-reset]");
  var radios = [].slice.call(document.querySelectorAll("input[name=svc-cat]"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function inCat(card, cat) { return !cat || (" " + card.getAttribute("data-cat") + " ").indexOf(" " + cat + " ") >= 0; }

  // how many services each device button has
  document.querySelectorAll("[data-n]").forEach(function (el) {
    var cat = el.getAttribute("data-n");
    el.textContent = cards.filter(function (c) { return inCat(c, cat); }).length;
  });

  // ignore filler words so "my iphone screen is cracked" still matches
  var STOP = { a: 1, an: 1, the: 1, my: 1, is: 1, it: 1, of: 1, on: 1, and: 1, or: 1, to: 1, for: 1, me: 1, with: 1, repair: 1, fix: 1, broken: 1, need: 1, won: 1, wont: 1, doesn: 1, not: 1 };

  function currentCat() { return (radios.filter(function (r) { return r.checked; })[0] || {}).value || ""; }
  function catLabel(cat) {
    var r = radios.filter(function (x) { return x.value === cat; })[0];
    return r ? r.nextElementSibling.firstChild.nextSibling.textContent.trim() : "";
  }

  function apply() {
    var cat = currentCat();
    var q = search.value.trim();
    var words = q.toLowerCase().split(/[^a-z0-9-]+/).filter(function (w) { return w.length > 1 && !STOP[w]; });
    var scores = cards.map(function (c) {
      if (!inCat(c, cat)) return -1;
      if (!words.length) return 0;
      var k = c.getAttribute("data-k");
      return words.filter(function (w) { return k.indexOf(w) >= 0 || (w.length > 4 && k.indexOf(w.slice(0, -1)) >= 0); }).length;
    });
    var best = Math.max.apply(null, scores);
    var shown = 0;
    cards.forEach(function (c, i) {
      var on = scores[i] >= 0 && (words.length ? scores[i] > 0 && scores[i] === best : true);
      c.hidden = !on;
      if (on) shown++;
    });
    groups.forEach(function (g) { g.hidden = !g.querySelector(".svc-card:not([hidden])"); });
    empty.hidden = shown > 0;
    clearBtn.hidden = !q;
    var filtered = cat || q;
    status.hidden = !filtered;
    if (filtered) {
      var txt = shown + (shown === 1 ? " service" : " services");
      if (cat) txt += " for " + catLabel(cat);
      if (q) txt += " matching “" + q + "”";
      count.textContent = shown ? txt : "No exact match";
    }
    document.querySelectorAll(".svc-ideas button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-q") === q.toLowerCase()));
    });
  }

  search.addEventListener("input", apply);
  radios.forEach(function (r) { r.addEventListener("change", apply); });
  clearBtn.addEventListener("click", function () { search.value = ""; apply(); search.focus(); });
  resetBtn.addEventListener("click", function () {
    search.value = "";
    radios.forEach(function (r) { r.checked = r.value === ""; });
    apply();
  });
  document.querySelectorAll(".svc-ideas button").forEach(function (b) {
    b.addEventListener("click", function () { search.value = b.getAttribute("data-q"); apply(); });
  });

  // ?q=battery or ?cat=console from links
  var qs = new URLSearchParams(location.search);
  if (qs.get("q")) search.value = qs.get("q");
  if (qs.get("cat")) radios.forEach(function (r) { r.checked = r.value === qs.get("cat"); });
  apply();

  // on phones the chip row slides sideways: keep the selected chip in view
  function showChip() {
    var r = radios.filter(function (x) { return x.checked; })[0];
    var row = r && r.closest(".svc-filters");
    if (!row || row.scrollWidth <= row.clientWidth) return;
    var chip = r.parentNode;
    row.scrollLeft = chip.offsetLeft - row.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
  }
  showChip();
  radios.forEach(function (r) { r.addEventListener("change", showChip); });

  if (location.hash) {
    var t = document.getElementById(location.hash.slice(1));
    if (t && t.classList.contains("svc-card")) t.classList.add("is-target");
  }

  /* Placeholder types out example searches while the box is empty */
  if (!reduce) {
    var examples = ["cracked iPhone screen", "PS5 no picture", "MacBook battery", "Galaxy S24 screen", "iPad won't charge", "water damage"];
    var ex = 0, pos = 0, deleting = false, paused = false;
    search.addEventListener("focus", function () { paused = true; search.placeholder = "What needs fixing?"; });
    search.addEventListener("blur", function () { paused = false; });
    (function tick() {
      var delay = 70;
      if (!paused && !search.value) {
        var word = examples[ex];
        if (!deleting) { pos++; if (pos >= word.length) { deleting = true; delay = 1600; } }
        else { pos--; delay = 35; if (pos <= 0) { deleting = false; ex = (ex + 1) % examples.length; delay = 400; } }
        search.placeholder = "Try “" + word.slice(0, pos) + "”";
      }
      setTimeout(tick, delay);
    })();
  }
})();
