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
      t.textContent = form.getAttribute("data-subject") === "Phone request"
        ? "We’ll call " + (ph || "you") + " when we have " + (model || "your phone") + "."
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
