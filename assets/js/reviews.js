/* Fixit4U — Google rating + reviews ("What customers say")
   1. Always shows the rating summary from config.js.
   2. With a Google Maps API key in config.js, loads live reviews straight
      from Google (Places API), keeping only the good ones (minRating+).
   3. Without a key, shows any reviews pasted into config.js by hand.        */
(function () {
  "use strict";
  var C = window.FIXIT || {};
  var R = C.reviews || {};
  var blocks = document.querySelectorAll("[data-reviews]");

  function setLinks(url, writeUrl) {
    document.querySelectorAll("[data-review-google]").forEach(function (a) { if (url) a.href = url; });
    document.querySelectorAll("[data-review-write]").forEach(function (a) { a.href = writeUrl || url || a.href; });
  }
  function setSummary(rating, count) {
    if (!rating) return;
    var r = Math.round(rating * 10) / 10;
    document.querySelectorAll("[data-rating]").forEach(function (el) { el.textContent = r.toFixed(1); });
    document.querySelectorAll("[data-rating-count]").forEach(function (el) { el.textContent = Number(count).toLocaleString("en-US"); });
    document.querySelectorAll("[data-rating-stars]").forEach(function (el) { el.style.width = Math.max(0, Math.min(100, r / 5 * 100)) + "%"; });
  }

  function initials(name) {
    return (name || "?").split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase();
  }

  function render(items, fromGoogle) {
    if (!items.length) return;
    blocks.forEach(function (wrap) {
      var list = wrap.querySelector("[data-reviews-list]");
      if (!list) return;
      list.innerHTML = "";
      // Homepage: leave out reviews that name the owner (owner's request).
      // They still show on the Reviews page.
      var shown = wrap.closest("[data-reviews-home]")
        ? items.filter(function (r) { return !/\bhass?an\b/i.test((r.text || "") + " " + (r.headline || "")); })
        : items;
      shown.forEach(function (r) {
        var fig = document.createElement("figure");
        fig.className = "review";

        var head = document.createElement("div");
        head.className = "review-head";
        var av = document.createElement(r.photo ? "img" : "span");
        av.className = "review-avatar";
        if (r.photo) { av.src = r.photo; av.alt = ""; av.width = 40; av.height = 40; av.loading = "lazy"; av.referrerPolicy = "no-referrer"; }
        else av.textContent = initials(r.author);
        head.appendChild(av);

        var who = document.createElement("figcaption");
        var name = document.createElement(r.authorUrl ? "a" : "span");
        name.className = "review-name";
        name.textContent = r.author;
        if (r.authorUrl) { name.href = r.authorUrl; name.target = "_blank"; name.rel = "noopener"; }
        who.appendChild(name);
        var meta = document.createElement("span");
        meta.className = "review-meta";
        var bits = [];
        if (r.when) bits.push(r.when);
        bits.push("on " + (r.source || "Google"));
        meta.textContent = bits.join(", ");
        who.appendChild(meta);
        head.appendChild(who);
        fig.appendChild(head);

        var rating = Math.max(0, Math.min(5, Math.round(+r.rating || 0)));
        if (rating) {
          var stars = document.createElement("p");
          stars.className = "review-stars";
          stars.setAttribute("aria-label", rating + " out of 5 stars");
          stars.textContent = "★★★★★".slice(0, rating) + "☆☆☆☆☆".slice(0, 5 - rating);
          fig.appendChild(stars);
        }
        if (r.headline) {
          var hl = document.createElement("p");
          hl.className = "review-headline";
          hl.textContent = "“" + r.headline + "”";
          fig.appendChild(hl);
        }
        var bq = document.createElement("blockquote");
        var p = document.createElement("p");
        p.textContent = r.text;
        bq.appendChild(p);
        fig.appendChild(bq);
        var src = document.createElement("a");
        src.className = "review-source";
        src.href = r.authorUrl || R.googleUrl || "#";
        src.target = "_blank"; src.rel = "noopener";
        src.textContent = "Read on " + (r.source || "Google");
        fig.appendChild(src);
        list.appendChild(fig);
      });
      list.hidden = false;
      setupCarousel(wrap, list, shown.length);
      // Long reviews: show the first lines with a "Read more" toggle.
      // Re-checked once web fonts load and on resize, since text width changes.
      var check = function () { addReadMore(list); };
      check();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(check);
      window.addEventListener("resize", check);
      var credit = wrap.querySelector("[data-reviews-credit]");
      if (credit) {
        credit.hidden = false;
        credit.textContent = fromGoogle ? "Reviews shown live from Google." : "Reviews from Google.";
      }
      // let the spotlight/reveal effects pick up the new cards
      list.querySelectorAll(".review").forEach(function (el, i) {
        if (document.documentElement.classList.contains("js-fx")) {
          el.style.setProperty("--i", Math.min(i, 6));
          el.setAttribute("data-reveal", "");
          requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("is-in"); }); });
        }
      });
    });
  }

  function addReadMore(list) {
    list.querySelectorAll(".review").forEach(function (card) {
      if (card.classList.contains("is-expanded")) return;
      var p = card.querySelector("blockquote p");
      var btn = card.querySelector(".review-more");
      var long = p && p.scrollHeight > p.clientHeight + 4;
      if (long && !btn) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "review-more"; b.textContent = "Read more";
        b.setAttribute("aria-expanded", "false");
        b.addEventListener("click", function () {
          var open = card.classList.toggle("is-expanded");
          b.textContent = open ? "Show less" : "Read more";
          b.setAttribute("aria-expanded", String(open));
        });
        card.insertBefore(b, card.querySelector(".review-source"));
      } else if (!long && btn) {
        btn.remove();
      }
    });
  }

  /* ---- Carousel: switches on automatically when there are more than 3 reviews ---- */
  function setupCarousel(wrap, list, count) {
    var nav = wrap.querySelector("[data-reviews-nav]");
    if (count <= 3 || !nav) { list.classList.remove("is-carousel"); if (nav) nav.hidden = true; return; }
    list.classList.add("is-carousel");
    list.setAttribute("tabindex", "0");
    list.setAttribute("aria-label", "Customer reviews, scroll sideways for more");
    nav.hidden = false;
    var dots = nav.querySelector("[data-rv-dots]");
    var cards = [].slice.call(list.children);
    var perView = function () { var c = cards[0]; return c ? Math.max(1, Math.round(list.clientWidth / (c.offsetWidth + 20))) : 1; };
    var pages = function () { return Math.max(1, Math.ceil(cards.length / perView())); };
    var current = function () { return Math.round(list.scrollLeft / Math.max(1, list.clientWidth)); };
    var go = function (pg) {
      var n = pages(); pg = (pg + n) % n;
      list.scrollTo({ left: pg * list.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
    };
    var drawDots = function () {
      dots.innerHTML = "";
      for (var i = 0; i < pages(); i++) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "rv-dot"; b.setAttribute("aria-label", "Show reviews page " + (i + 1));
        (function (i) { b.addEventListener("click", function () { go(i); }); })(i);
        dots.appendChild(b);
      }
      mark();
    };
    var mark = function () {
      var c = current();
      [].forEach.call(dots.children, function (d, i) { d.classList.toggle("is-on", i === c); d.setAttribute("aria-current", i === c ? "true" : "false"); });
    };
    nav.querySelector("[data-rv-prev]").onclick = function () { go(current() - 1); };
    nav.querySelector("[data-rv-next]").onclick = function () { go(current() + 1); };
    list.addEventListener("scroll", function () { window.requestAnimationFrame(mark); }, { passive: true });
    window.addEventListener("resize", drawDots);
    drawDots();
    // auto-advance every 6s; pauses while hovered, focused or off-screen
    if (reduceMotion) return;
    var paused = false, visible = true;
    list.addEventListener("mouseenter", function () { paused = true; });
    list.addEventListener("mouseleave", function () { paused = false; });
    wrap.addEventListener("focusin", function () { paused = true; });
    wrap.addEventListener("focusout", function () { paused = false; });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(list);
    setInterval(function () { if (!paused && visible && !document.hidden) go(current() + 1); }, 6000);
  }
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1. summary from config ---- */
  setLinks(R.googleUrl, R.writeReviewUrl);
  if (R.summary) setSummary(R.summary.rating, R.summary.count);

  /* ---- 3. hand-pasted reviews ---- */
  function manual() {
    var items = (R.items || []).filter(function (r) { return r && r.text && r.author && (+r.rating || 5) >= (R.minRating || 0); })
      .slice(0, R.max || 6)
      .map(function (r) {
        var when = "";
        if (r.date) {
          var d = new Date(r.date + "T12:00:00");
          if (!isNaN(d)) when = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        }
        return { author: r.author, rating: r.rating, text: r.text, when: when, source: r.source || "Google", headline: r.headline || "" };
      });
    render(items, false);
  }

  /* ---- 2. live Google reviews ---- */
  if (!blocks.length) return;          // pages that only show the rating
  if (!R.googleApiKey) { manual(); return; }

  var CACHE_KEY = "fixit4u-reviews-v1";
  try {
    var cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.t < 6 * 3600 * 1000) { apply(cached.d); return; }
  } catch (e) { /* storage unavailable */ }

  function apply(d) {
    setSummary(d.rating, d.count);
    var write = R.writeReviewUrl || (d.id ? "https://search.google.com/local/writereview?placeid=" + encodeURIComponent(d.id) : "");
    setLinks(d.url || R.googleUrl, write);
    if (d.reviews && d.reviews.length) render(d.reviews, true); else manual();
  }

  function loadMaps(key) {
    return new Promise(function (resolve, reject) {
      if (window.google && google.maps && google.maps.importLibrary) return resolve();
      var timer = setTimeout(function () { reject(new Error("Maps timeout")); }, 12000);
      window.__fixitMapsReady = function () { clearTimeout(timer); resolve(); };
      var s = document.createElement("script");
      s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(key) + "&v=weekly&loading=async&callback=__fixitMapsReady";
      s.async = true;
      s.onerror = function () { clearTimeout(timer); reject(new Error("Maps failed to load")); };
      document.head.appendChild(s);
    });
  }

  loadMaps(R.googleApiKey)
    .then(function () { return google.maps.importLibrary("places"); })
    .then(function (lib) {
      var Place = lib.Place;
      var idP = R.placeId ? Promise.resolve(R.placeId)
        : Place.searchByText({ textQuery: R.placeQuery, fields: ["id"], maxResultCount: 1 })
          .then(function (res) { if (!res.places || !res.places.length) throw new Error("Place not found"); return res.places[0].id; });
      return idP.then(function (id) {
        var place = new Place({ id: id });
        return place.fetchFields({ fields: ["rating", "userRatingCount", "reviews", "googleMapsURI"] }).then(function () {
          var min = R.minRating || 0;
          var reviews = (place.reviews || [])
            .filter(function (rv) { return (rv.rating || 0) >= min && rv.text; })
            .slice(0, R.max || 6)
            .map(function (rv) {
              var a = rv.authorAttribution || {};
              return {
                author: a.displayName || "Google user",
                authorUrl: a.uri || "",
                photo: a.photoURI || "",
                rating: rv.rating,
                text: String(rv.text),
                when: rv.relativePublishTimeDescription || "",
                source: "Google"
              };
            });
          var d = { id: id, rating: place.rating, count: place.userRatingCount, url: place.googleMapsURI, reviews: reviews };
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) { /* ignore */ }
          apply(d);
        });
      });
    })
    .catch(function (err) {
      if (window.console) console.warn("Google reviews unavailable:", err && err.message);
      manual();
    });
})();
