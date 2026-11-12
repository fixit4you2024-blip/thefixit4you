/* Fixit4U — Contact page: copy address + "Send us a message" form */
(function () {
  "use strict";
  var C = window.FIXIT || {};

  /* ---- Copy address ---- */
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var text = b.getAttribute("data-copy"), label = b.textContent;
      var ok = function () { b.textContent = "Copied"; b.classList.add("is-done"); setTimeout(function () { b.textContent = label; b.classList.remove("is-done"); }, 2000); };
      var ask = function () { try { window.prompt("Copy this:", text); } catch (e) { /* prompt not available */ } };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, ask);
      else ask();
    });
  });

  /* ---- Message form ---- */
  var form = document.querySelector("[data-msg-form]");
  if (!form) return;
  var wrap = form.parentElement, done = wrap.querySelector("[data-msg-done]");
  var status = form.querySelector("[data-msg-status]"), btn = form.querySelector("[type=submit]");
  var emailBox = form.querySelector("[data-msg-email]");
  var el = form.elements, loadedAt = Date.now();

  function digits(v) { var d = v.replace(/\D/g, ""); return d.length === 11 && d[0] === "1" ? d.slice(1) : d; }
  function fmtPhone(v) {
    var d = digits(v).slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return "(" + d.slice(0, 3) + ") " + d.slice(3);
    return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
  }
  function reply() { var r = form.querySelector("input[name=reply]:checked"); return r ? r.value : "Text"; }

  el.phone.addEventListener("input", function () {
    if (el.phone.selectionStart === el.phone.value.length) el.phone.value = fmtPhone(el.phone.value);
  });
  form.querySelectorAll("input[name=reply]").forEach(function (r) {
    r.addEventListener("change", function () {
      emailBox.hidden = reply() !== "Email";
      if (!emailBox.hidden) el.email.focus();
    });
  });

  var rules = {
    name: function () { return el.name.value.trim().length >= 2 ? "" : "Enter your name."; },
    phone: function () { return digits(el.phone.value).length === 10 ? "" : "Enter a 10-digit phone number."; },
    message: function () { return el.message.value.trim().length >= 2 ? "" : "Type your message."; },
    email: function () {
      if (reply() !== "Email") return "";
      var v = el.email.value.trim();
      if (!v) return "Enter your email so we can reply by email.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Check your email address.";
    }
  };
  function check(k) {
    var msg = rules[k](), f = el[k], err = document.getElementById(f.getAttribute("aria-describedby"));
    f.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return msg;
  }
  Object.keys(rules).forEach(function (k) {
    el[k].addEventListener("input", function () { if (el[k].getAttribute("aria-invalid") === "true") check(k); });
  });
  function say(html) { status.innerHTML = html; status.hidden = !html; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = null;
    Object.keys(rules).forEach(function (k) { if (check(k) && !bad) bad = el[k]; });
    if (bad) { bad.focus(); return; }
    if (el._honey.value || Date.now() - loadedAt < 2500) { finish(); return; }
    var email = reply() === "Email" ? el.email.value.trim() : "";
    var payload = {
      name: el.name.value.trim(),
      phone: fmtPhone(el.phone.value),
      reply_by: reply(),
      message: el.message.value.trim(),
      _subject: "Message from website: " + el.name.value.trim() + " · reply by " + reply(),
      _template: "table", _captcha: "false", _honey: ""
    };
    if (email) { payload.email = email; payload._replyto = email; }
    btn.disabled = true; var label = btn.textContent; btn.textContent = "Sending…"; say("");
    fetch(C.form.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (d) {
        if (!(res.ok && (d.success === true || d.success === "true"))) throw new Error(d.message || "HTTP " + res.status);
      });
    }).then(finish).catch(function (err) {
      if (window.console) console.warn("Message failed:", err && err.message);
      say("That didn’t send. Try again, or call <a href=\"" + (C.phoneHref || "tel:+13348490404") + "\">" + (C.phoneDisplay || "(334) 849-0404") + "</a>.");
    }).then(function () { btn.disabled = false; btn.textContent = label; });
  });

  function finish() {
    var first = el.name.value.trim().split(/\s+/)[0];
    var r = reply(), ph = fmtPhone(el.phone.value);
    done.querySelector("[data-msg-done-title]").textContent = first ? "Thanks, " + first + "." : "Thanks.";
    done.querySelector("[data-msg-done-text]").textContent =
      (r === "Text" ? "We’ll text " + ph : r === "Call" ? "We’ll call " + ph : "We’ll email " + el.email.value.trim()) + " during business hours.";
    form.hidden = true; done.hidden = false; done.focus();
  }
})();
