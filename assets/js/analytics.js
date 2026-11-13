/* Fixit4U — Google Analytics (GA4).
   Turns on only when config.js has an analyticsId (like "G-XXXXXXXXXX") and
   the page is on the real website (not a local preview).
   Besides normal page views it records these actions, which show up in
   Google Analytics → Reports → Engagement → Events:
     call_click, text_click, email_click, directions_click,
     generate_lead (a quote, appointment, message, callback, price or
     buy/sell form was sent; "form_type" says which),
     chat_open, chat_question (no question text is sent to Google). */
(function () {
  "use strict";
  var C = window.FIXIT || {};
  var id = (C.analyticsId || "").trim();
  var local = /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname) || location.protocol === "file:";
  var on = /^G-[A-Z0-9]+$/i.test(id) && !local;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.fxTrack = function (name, params) {
    if (on) gtag("event", name, params || {});
    else if (local && window.console && console.debug) console.debug("[analytics]", name, params || {});
  };
  if (on) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", id);
  }

  // Clicks on call / text / email / directions links
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var h = a.getAttribute("href") || "";
    var where = { link_text: (a.textContent || "").trim().slice(0, 60), page: location.pathname };
    if (/^tel:/i.test(h)) fxTrack("call_click", where);
    else if (/^sms:/i.test(h)) fxTrack("text_click", where);
    else if (/^mailto:/i.test(h)) fxTrack("email_click", where);
    else if (/google\.[a-z.]+\/maps\/dir|maps\/dir\//i.test(h)) fxTrack("directions_click", where);
  }, true);

  // A website form was sent successfully (all forms post to the FormSubmit endpoint)
  var endpoint = C.form && C.form.endpoint;
  if (endpoint && window.fetch) {
    var realFetch = window.fetch;
    window.fetch = function (url, opts) {
      var p = realFetch.apply(this, arguments);
      try {
        if (String(url) === endpoint && opts && typeof opts.body === "string") {
          var subject = (JSON.parse(opts.body)._subject || "").split(":")[0];
          p.then(function (res) { if (res.ok) fxTrack("generate_lead", { form_type: subject || "form", page: location.pathname }); }, function () {});
        }
      } catch (err) { /* not a form we know */ }
      return p;
    };
  }
})();
