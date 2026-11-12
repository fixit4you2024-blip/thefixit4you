/* Fixit4U — futuristic effects: circuits, diagnostic readout, scroll reveal,
   cursor spotlight, marquee. Purely decorative; the site works without it. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.__fxReady = true;
  if (reduce) root.classList.remove("js-fx");

  /* ---------- Circuit traces ---------- */
  var PATHS = [
    { d: "M0 140H160L200 180H380L420 220V300", dur: 7, del: 0 },
    { d: "M0 520H90L130 480H300L340 520H520", dur: 8, del: 1.6, gold: true },
    { d: "M60 800V700L100 660H260L300 620V560", dur: 6.5, del: 3.2 },
    { d: "M640 0V60L680 100H860", dur: 5.5, del: 2.2 },
    { d: "M520 800V740L560 700H720L760 660H900", dur: 7.5, del: 4.1, gold: true },
    { d: "M0 330H60L100 370H200", dur: 4.5, del: .8 },
    { d: "M300 0V40L340 80H460L500 120", dur: 5, del: 2.9 },
    { d: "M1440 90H1310L1270 130H1140", dur: 6, del: 1.2 },
    { d: "M1440 690H1320L1280 650H1180L1140 610", dur: 7, del: 3.6, gold: true },
    { d: "M760 300H840L880 260V180", dur: 4.8, del: 5 }
  ];
  function ends(d) {
    var nums = d.match(/-?\d+(\.\d+)?/g).map(Number);
    var start = [nums[0], nums[1]];
    // walk the path commands to find the end point
    var x = nums[0], y = nums[1];
    var re = /([HVL])\s*(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?))?/g, m;
    while ((m = re.exec(d))) {
      if (m[1] === "H") x = +m[2];
      else if (m[1] === "V") y = +m[2];
      else { x = +m[2]; y = +m[3]; }
    }
    return [start, [x, y]];
  }
  function circuitSVG() {
    var base = "", pulse = "", nodes = "";
    PATHS.forEach(function (p, i) {
      base += '<path class="c-base" d="' + p.d + '"/>';
      pulse += '<path class="c-pulse' + (p.gold ? " gold" : "") + '" pathLength="100" d="' + p.d +
        '" style="--dur:' + p.dur + "s;--del:-" + p.del + 's"/>';
      var e = ends(p.d)[1];
      nodes += '<circle class="c-node' + (i % 3 === 1 ? " gold" : "") + '" cx="' + e[0] + '" cy="' + e[1] +
        '" r="4" style="--del:' + (i * 0.4) + 's"/>';
    });
    return '<svg class="circuit" viewBox="0 0 1440 800" preserveAspectRatio="xMinYMid slice" aria-hidden="true" focusable="false">' +
      base + pulse + nodes + "</svg>";
  }
  document.querySelectorAll(".hero, .page-hero, .cta-band, .site-footer").forEach(function (el) {
    el.insertAdjacentHTML("afterbegin", circuitSVG());
  });
  // Same neon floor + rising particles as the home hero, on every page header
  document.querySelectorAll(".page-hero").forEach(function (el) {
    el.insertAdjacentHTML("afterbegin",
      '<div class="holo-floor" aria-hidden="true"></div>' +
      '<div class="holo-particles" aria-hidden="true">' + new Array(13).join("<i></i>") + "</div>");
  });

  /* ---------- Diagnostic readout ---------- */
  var hud = document.querySelector("[data-hud]");
  if (hud) {
    var rows = [].slice.call(hud.querySelectorAll("li"));
    var pctEl = hud.querySelector("[data-hud-pct]");
    var bar = hud.querySelector("[data-hud-bar]");
    var pct = { set textContent(v) { pctEl.textContent = v; if (bar) bar.style.width = v; } };
    var label = function (r, t) { r.querySelector("em").textContent = t; };
    if (reduce) {
      rows.forEach(function (r) { r.className = "is-ok"; label(r, "OK"); });
      pct.textContent = "100%";
    } else {
      var i = 0;
      var step = function () {
        if (i === 0) {
          rows.forEach(function (r) { r.className = ""; label(r, "Queued"); });
          pct.textContent = "0%";
        }
        var r = rows[i];
        r.className = "is-checking";
        label(r, "Checking");
        setTimeout(function () {
          r.className = "is-ok";
          label(r, "OK");
          i++;
          pct.textContent = Math.round(i / rows.length * 100) + "%";
          if (i >= rows.length) { i = 0; setTimeout(step, 3400); }
          else setTimeout(step, 220);
        }, 900);
      };
      setTimeout(step, 1600);
    }
  }

  /* ---------- Marquee: duplicate the list for a seamless loop ---------- */
  document.querySelectorAll(".marquee-track").forEach(function (track) {
    var list = track.querySelector("ul");
    if (!list || track.children.length > 1) return;
    var copy = list.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    track.appendChild(copy);
  });

  /* ---------- Scroll reveal ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    var SEL = [
      ".section-head", ".split-head > .text-link", ".device-tile", ".repair-index li", ".steps li",
      ".why-aside > *", ".why-list li", ".feature-compare > div", ".reviews-cta", ".review",
      ".visit-photos figure", ".visit > div:last-child", ".service-card", ".service-group > h2", ".service-group > p",
      ".bench figure", ".gallery-grid > figure", ".contact-lines li", ".hours-card", ".map-frame", ".find-us",
      ".quote-layout", ".estimate-note", ".form-card", ".side-card", ".cta-grid > *", ".cta-inner > *",
      ".buysell > *", ".warranty-note", ".rating-card", ".rating-strip", ".faq-item", ".split > *", ".fact", ".visit-map"
    ].join(",");
    var counts = new Map();
    document.querySelectorAll(SEL).forEach(function (el) {
      if (el.closest(".hero")) return;
      var parent = el.parentElement;
      var n = counts.get(parent) || 0;
      counts.set(parent, n + 1);
      el.setAttribute("data-reveal", "");
      el.style.setProperty("--i", Math.min(n, 6));
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    document.querySelectorAll("[data-reveal]").forEach(function (el) { io.observe(el); });
    // Deep links (e.g. services.html#battery): show the target right away
    if (location.hash) {
      var t = document.getElementById(location.hash.slice(1));
      if (t && t.hasAttribute("data-reveal")) t.classList.add("is-in");
    }
  }

  /* ---------- Stats: count up from 0 when scrolled into view ---------- */
  document.querySelectorAll("[data-count-group]").forEach(function (group) {
    var nums = [].slice.call(group.querySelectorAll("[data-count]"));
    if (reduce || !("IntersectionObserver" in window)) return;
    var run = function () {
      nums.forEach(function (el) {
        var target = parseFloat(el.textContent.replace(/,/g, ""));
        if (isNaN(target)) return;
        var decimals = (el.textContent.split(".")[1] || "").length;
        var start = performance.now(), dur = 1500;
        var tick = function (now) {
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(decimals);
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = target.toFixed(decimals);
        };
        requestAnimationFrame(tick);
      });
    };
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(); o.disconnect(); } });
    }, { threshold: 0.5 });
    o.observe(group);
  });

  /* ---------- Journey steps: run the light line when in view ---------- */
  document.querySelectorAll("[data-steps]").forEach(function (el) {
    if (reduce || !("IntersectionObserver" in window)) { el.classList.add("is-live"); return; }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { el.classList.add("is-live"); o.disconnect(); } });
    }, { threshold: 0.35 });
    o.observe(el);
  });

  /* ---------- "Look inside" 3D iPhone: tap to toggle on touch screens ---------- */
  document.querySelectorAll("[data-xray]").forEach(function (fig) {
    // Auto-play: take it apart when it scrolls into view, then put it back together
    var autoTimer = null;
    var play = function (ms) {
      fig.classList.add("is-auto");
      clearTimeout(autoTimer);
      autoTimer = setTimeout(function () { fig.classList.remove("is-auto"); }, ms);
    };
    if ("IntersectionObserver" in window && !reduce) {
      var seen = false;
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !seen) { seen = true; setTimeout(function () { play(4200); }, 500); }
          if (!e.isIntersecting) seen = false; // replay next time it comes into view
        });
      }, { threshold: 0.6 }).observe(fig);
    }
    // Hovering any reason in the list takes the phone apart too
    var section = fig.closest("section");
    if (section) {
      section.querySelectorAll(".why-list li").forEach(function (li) {
        li.addEventListener("mouseenter", function () { clearTimeout(autoTimer); fig.classList.add("is-auto"); });
        li.addEventListener("mouseleave", function () { play(900); });
      });
    }
    // Part labels: highlight that layer while hovered/focused
    fig.querySelectorAll("[data-hl]").forEach(function (a) {
      var on = function () { fig.setAttribute("data-hl", a.getAttribute("data-hl")); };
      var off = function () { fig.removeAttribute("data-hl"); };
      a.addEventListener("mouseenter", on); a.addEventListener("focus", on);
      a.addEventListener("mouseleave", off); a.addEventListener("blur", off);
      a.addEventListener("click", function (e) { e.stopPropagation(); }); // follow the link, don't toggle
    });
    // Cursor tilt (mouse/trackpad only)
    if (!reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      var par = fig.querySelector(".xray-parallax");
      if (par) {
        fig.addEventListener("pointermove", function (e) {
          var r = fig.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          par.style.setProperty("--tx", (x * 18).toFixed(2) + "deg");
          par.style.setProperty("--ty", (-y * 12).toFixed(2) + "deg");
        });
        fig.addEventListener("pointerleave", function () {
          par.style.setProperty("--tx", "0deg"); par.style.setProperty("--ty", "0deg");
        });
      }
    }
    fig.addEventListener("click", function () { fig.classList.toggle("is-open"); });
    fig.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fig.classList.toggle("is-open"); }
      if (e.key === "Escape") fig.classList.remove("is-open");
    });
  });

  /* ---------- Cursor spotlight on cards ---------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".service-card, .dock-tile, .review, .side-card").forEach(function (el) {
      el.classList.add("fx-spot");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }
})();
