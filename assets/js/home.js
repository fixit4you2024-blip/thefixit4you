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
