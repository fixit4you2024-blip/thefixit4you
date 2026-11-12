/* Fixit4U — "Call me back" quick form. Sends through the same endpoint as
   the quote form (see config.js). */
(function () {
  "use strict";
  var C = window.FIXIT || {};
  var H = window.FIXIT_HOURS;

  /* ---- Live line: when will we call? (from the business hours) ---- */
  document.querySelectorAll("[data-cb-live]").forEach(function (el) {
    if (!H || !C.hours) return;
    var hours = C.hours, now = H.shopNow();
    var idx = hours.findIndex(function (h) { return h.day === now.day; });
    if (idx < 0) return;
    var t = hours[idx], text, open = false;
    if (t.open && now.mins >= H.toMin(t.open) && now.mins < H.toMin(t.close) - 15) {
      open = true; text = "Open now until " + H.fmtTime(t.close) + ", so we can call you back soon.";
    } else if (t.open && now.mins < H.toMin(t.open)) {
      text = "Closed now. We'll call when we open today at " + H.fmtTime(t.open) + ".";
    } else {
      for (var k = 1; k <= 7; k++) {
        var n = hours[(idx + k) % 7];
        if (n.open) { text = "Closed now. We'll call when we open " + (k === 1 ? "tomorrow" : n.day) + " at " + H.fmtTime(n.open) + "."; break; }
      }
    }
    if (!text) return;
    el.querySelector("[data-cb-live-text]").textContent = text;
    el.classList.add(open ? "is-open" : "is-closed");
  });

  function digits(v) { var d = v.replace(/\D/g, ""); return d.length === 11 && d[0] === "1" ? d.slice(1) : d; }
  function formatPhone(v) {
    var d = digits(v).slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return "(" + d.slice(0, 3) + ") " + d.slice(3);
    return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
  }

  document.querySelectorAll("form[data-callback]").forEach(function (form) {
    var wrap = form.parentElement;
    var done = wrap.querySelector("[data-cb-done]");
    var loadedAt = Date.now();
    var status = form.querySelector("[data-cb-status]");
    var btn = form.querySelector("[type=submit]");
    var name = form.elements.name, phone = form.elements.phone, issue = form.elements.problem, honey = form.elements._honey;

    var rules = {
      name: function () { return name.value.trim().length >= 2 ? "" : "Enter your name."; },
      phone: function () { return digits(phone.value).length === 10 ? "" : "Enter a 10-digit phone number."; }
    };
    var fields = { name: name, phone: phone };
    function check(key, show) {
      var msg = rules[key]();
      if (show) {
        var f = fields[key], err = document.getElementById(f.getAttribute("aria-describedby"));
        f.setAttribute("aria-invalid", msg ? "true" : "false");
        if (err) { err.textContent = msg; err.hidden = !msg; }
      }
      return msg;
    }
    Object.keys(fields).forEach(function (k) {
      fields[k].addEventListener("blur", function () { if (fields[k].value) check(k, true); });
      fields[k].addEventListener("input", function () { if (fields[k].getAttribute("aria-invalid") === "true") check(k, true); });
    });
    // format the phone number as it's typed
    phone.addEventListener("input", function () {
      var atEnd = phone.selectionStart === phone.value.length;
      var f = formatPhone(phone.value);
      if (atEnd && f !== phone.value) phone.value = f;
    });

    function say(html) { status.innerHTML = html; status.hidden = !html; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = null;
      ["name", "phone"].forEach(function (k) { if (check(k, true) && !bad) bad = fields[k]; });
      if (bad) { bad.focus(); return; }
      if (honey.value || Date.now() - loadedAt < 2500) { finish(); return; }

      var best = (form.querySelector("input[name=best_time]:checked") || {}).value || "Any time";
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = "Sending…";
      say("");
      fetch(C.form.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: name.value.trim(),
          phone: formatPhone(phone.value),
          best_time_to_call: best,
          problem: issue.value.trim() || "Not given",
          request: "Please call me back",
          _subject: "Callback request from " + name.value.trim() + " (" + best + ")",
          _template: "table",
          _captcha: "false",
          _honey: ""
        })
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!(res.ok && (data.success === true || data.success === "true"))) throw new Error(data.message || "HTTP " + res.status);
          });
        })
        .then(finish)
        .catch(function (err) {
          if (window.console) console.warn("Callback send failed:", err && err.message);
          say("That didn’t send. Try again, or call us at <a href=\"" + C.phoneHref + "\">" + C.phoneDisplay + "</a>.");
        })
        .then(function () { btn.disabled = false; btn.textContent = label; });
    });

    function finish() {
      var first = name.value.trim().split(/\s+/)[0] || "";
      var ph = formatPhone(phone.value);
      if (done) {
        done.querySelector("[data-cb-done-title]").textContent = first ? "Thanks, " + first + "." : "Thanks.";
        done.querySelector("[data-cb-done-text]").textContent = "We’ll call " + (ph || "you") + " soon.";
        form.hidden = true;
        done.hidden = false;
        done.focus();
      } else {
        say("Thanks. We’ll call you back soon.");
      }
      form.reset();
      [name, phone].forEach(function (f) { f.removeAttribute("aria-invalid"); });
    }
    if (done) {
      done.querySelector("[data-cb-again]").addEventListener("click", function () {
        done.hidden = true; form.hidden = false; loadedAt = Date.now(); name.focus();
      });
    }
  });
})();
