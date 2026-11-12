/* ==========================================================================
   Fixit4U — devices, repairs and quote options
   --------------------------------------------------------------------------
   HOW TO ADD A PRICE ESTIMATE
   Add a line to `prices` below using the key  "device|model|repair".
   Use "*" as the model to cover every model of that device.

     "iphone|iPhone 13|screen":                              { from: 109, to: 359 },
     "iphone|*|battery":          { from: 69 },
     "samsung|Galaxy S24|screen": { from: 199, to: 249, note: "OLED screen" },

   The most specific match wins (exact model first, then "*").
   Anything without a price shows "Free quote" so customers ask you directly.
   Prices are always shown as estimates on the site.
   ========================================================================== */
window.FIXIT_PRICING = {
  repairs: {
    "screen":        "Screen replacement",
    "battery":       "Battery replacement",
    "charging-port": "Charging port repair",
    "camera":        "Camera repair",
    "back-glass":    "Back glass replacement",
    "speaker":       "Speaker or microphone",
    "water":         "Water damage diagnostic",
    "keyboard":      "Keyboard or trackpad",
    "software":      "Slow, frozen or won't boot",
    "hdmi":          "HDMI port",
    "power":         "Won't turn on",
    "overheating":   "Overheating or loud fan",
    "controller":    "Controller or Joy-Con",
    "data-transfer": "Data transfer",
    "unlock":        "Phone unlocking",
    "sell":          "Sell my phone",
    "diagnostic":    "Diagnostic / not sure",
    "other":         "Something else"
  },

  // No price range is shown (free quotes only).
  typicalRange: null,
  noRange: ["data-transfer", "unlock", "sell", "diagnostic", "other"],

  devices: [
    {
      id: "iphone",
      label: "iPhone",
      models: [
        "iPhone 18 Pro Max", "iPhone 18 Pro",
        "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone Air", "iPhone 17", "iPhone 17e",
        "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16", "iPhone 16e",
        "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
        "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
        "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
        "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini",
        "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
        "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X",
        "iPhone SE (2nd or 3rd gen)", "iPhone 8 Plus", "iPhone 8",
        "iPhone 7 Plus", "iPhone 7", "iPhone 6s Plus / 6 Plus", "iPhone 6s / 6",
        "Older or not sure"
      ],
      repairs: ["screen", "battery", "charging-port", "camera", "back-glass", "speaker", "water", "data-transfer", "unlock", "sell", "diagnostic", "other"]
    },
    {
      id: "samsung",
      label: "Samsung Galaxy",
      models: [
        "Galaxy S25 Ultra", "Galaxy S25+", "Galaxy S25", "Galaxy S25 FE",
        "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S24 FE",
        "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S23 FE",
        "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22",
        "Galaxy S21 Ultra", "Galaxy S21+", "Galaxy S21", "Galaxy S21 FE",
        "Galaxy Z Fold (any)", "Galaxy Z Flip (any)",
        "Galaxy A-series (A15, A25, A35, A55…)", "Galaxy Note (any)",
        "Older or not sure"
      ],
      repairs: ["screen", "battery", "charging-port", "camera", "back-glass", "speaker", "water", "data-transfer", "unlock", "sell", "diagnostic", "other"]
    },
    {
      id: "phone-other",
      label: "Other smartphone",
      models: [
        "Google Pixel", "Motorola", "OnePlus", "LG", "TCL", "Other brand"
      ],
      repairs: ["screen", "battery", "charging-port", "camera", "speaker", "water", "data-transfer", "unlock", "sell", "diagnostic", "other"]
    },
    {
      id: "tablet",
      label: "Tablet / iPad",
      models: [
        "iPad Pro", "iPad Air", "iPad (standard)", "iPad mini",
        "Samsung Galaxy Tab", "Amazon Fire tablet", "Other tablet"
      ],
      repairs: ["screen", "battery", "charging-port", "camera", "water", "diagnostic", "other"]
    },
    {
      id: "laptop",
      label: "Laptop",
      models: [
        "MacBook Air", "MacBook Pro", "Windows laptop", "Chromebook", "Other laptop"
      ],
      repairs: ["screen", "battery", "keyboard", "charging-port", "water", "software", "diagnostic", "other"]
    },
    {
      id: "console",
      label: "Game console",
      models: [
        "PlayStation 5", "PlayStation 4", "Xbox Series X or S", "Xbox One",
        "Nintendo Switch / Switch OLED", "Nintendo Switch Lite", "Nintendo Switch 2", "Other console"
      ],
      repairs: ["hdmi", "power", "overheating", "controller", "diagnostic", "other"]
    },
    {
      id: "watch",
      label: "Smartwatch",
      models: [
        "Apple Watch", "Samsung Galaxy Watch", "Google Pixel Watch", "Other smartwatch"
      ],
      repairs: ["screen", "battery", "diagnostic", "other"]
    },
    {
      id: "other",
      label: "Other electronics",
      models: ["Other electronic device"],
      repairs: ["diagnostic", "other"]
    }
  ],

  // Estimated iPhone prices from the owner's price sheet (2026-11-12, corrected for iPhone 8–14).
  // Shown only in the Prices page quote tool as an estimate. from = to means one fixed price.
  prices: {
    "iphone|iPhone 18 Pro Max|screen":                  { from: 549, to: 549 },
    "iphone|iPhone 18 Pro Max|battery":                 { from: 119, to: 189 },
    "iphone|iPhone 18 Pro Max|back-glass":              { from: 129, to: 239 },
    "iphone|iPhone 18 Pro|screen":                      { from: 549, to: 549 },
    "iphone|iPhone 18 Pro|battery":                     { from: 119, to: 189 },
    "iphone|iPhone 18 Pro|back-glass":                  { from: 129, to: 239 },
    "iphone|iPhone 17 Pro Max|screen":                  { from: 179, to: 529 },
    "iphone|iPhone 17 Pro Max|battery":                 { from: 119, to: 189 },
    "iphone|iPhone 17 Pro Max|back-glass":              { from: 129, to: 239 },
    "iphone|iPhone 17 Pro|screen":                      { from: 179, to: 459 },
    "iphone|iPhone 17 Pro|battery":                     { from: 119, to: 189 },
    "iphone|iPhone 17 Pro|back-glass":                  { from: 129, to: 239 },
    "iphone|iPhone 17e|screen":                         { from: 119, to: 349 },
    "iphone|iPhone 17e|battery":                        { from: 109, to: 159 },
    "iphone|iPhone 17e|back-glass":                     { from: 109, to: 229 },
    "iphone|iPhone 17|screen":                          { from: 119, to: 459 },
    "iphone|iPhone 17|battery":                         { from: 109, to: 159 },
    "iphone|iPhone 17|back-glass":                      { from: 109, to: 229 },
    "iphone|iPhone Air|screen":                         { from: 159, to: 359 },
    "iphone|iPhone Air|battery":                        { from: 119, to: 159 },
    "iphone|iPhone Air|back-glass":                     { from: 109, to: 239 },
    "iphone|iPhone 16 Pro Max|screen":                  { from: 129, to: 469 },
    "iphone|iPhone 16 Pro Max|battery":                 { from: 119, to: 159 },
    "iphone|iPhone 16 Pro Max|back-glass":              { from: 119, to: 239 },
    "iphone|iPhone 16 Pro|screen":                      { from: 119, to: 429 },
    "iphone|iPhone 16 Pro|battery":                     { from: 119, to: 159 },
    "iphone|iPhone 16 Pro|back-glass":                  { from: 119, to: 239 },
    "iphone|iPhone 16 Plus|screen":                     { from: 119, to: 429 },
    "iphone|iPhone 16 Plus|battery":                    { from: 109, to: 159 },
    "iphone|iPhone 16 Plus|back-glass":                 { from: 109, to: 229 },
    "iphone|iPhone 16|screen":                          { from: 119, to: 379 },
    "iphone|iPhone 16|battery":                         { from: 99, to: 159 },
    "iphone|iPhone 16|back-glass":                      { from: 109, to: 229 },
    "iphone|iPhone 16e|screen":                         { from: 109, to: 329 },
    "iphone|iPhone 16e|battery":                        { from: 99, to: 159 },
    "iphone|iPhone 16e|back-glass":                     { from: 109, to: 229 },
    "iphone|iPhone 15 Pro Max|screen":                  { from: 129, to: 459 },
    "iphone|iPhone 15 Pro Max|battery":                 { from: 109, to: 159 },
    "iphone|iPhone 15 Pro Max|back-glass":              { from: 119, to: 239 },
    "iphone|iPhone 15 Pro|screen":                      { from: 119, to: 399 },
    "iphone|iPhone 15 Pro|battery":                     { from: 109, to: 159 },
    "iphone|iPhone 15 Pro|back-glass":                  { from: 119, to: 239 },
    "iphone|iPhone 15 Plus|screen":                     { from: 119, to: 419 },
    "iphone|iPhone 15 Plus|battery":                    { from: 99, to: 159 },
    "iphone|iPhone 15 Plus|back-glass":                 { from: 109, to: 229 },
    "iphone|iPhone 15|screen":                          { from: 109, to: 359 },
    "iphone|iPhone 15|battery":                         { from: 99, to: 159 },
    "iphone|iPhone 15|back-glass":                      { from: 109, to: 229 },
    "iphone|iPhone 14 Pro Max|screen":                  { from: 119, to: 459 },
    "iphone|iPhone 14 Pro Max|battery":                 { from: 109, to: 159 },
    "iphone|iPhone 14 Pro Max|back-glass":              { from: 139, to: 139 },
    "iphone|iPhone 14 Pro|screen":                      { from: 119, to: 419 },
    "iphone|iPhone 14 Pro|battery":                     { from: 109, to: 159 },
    "iphone|iPhone 14 Pro|back-glass":                  { from: 139, to: 139 },
    "iphone|iPhone 14 Plus|screen":                         { from: 129, to: 399 },
    "iphone|iPhone 14 Plus|battery":                        { from: 99, to: 159 },
    "iphone|iPhone 14 Plus|back-glass":                     { from: 109, to: 229 },
    "iphone|iPhone 14|screen":                              { from: 129, to: 359 },
    "iphone|iPhone 14|battery":                             { from: 99, to: 159 },
    "iphone|iPhone 14|back-glass":                          { from: 109, to: 229 },
    "iphone|iPhone 13 Pro Max|screen":                      { from: 129, to: 399 },
    "iphone|iPhone 13 Pro Max|battery":                     { from: 99, to: 159 },
    "iphone|iPhone 13 Pro Max|back-glass":                  { from: 139, to: 139 },
    "iphone|iPhone 13 Pro|screen":                          { from: 109, to: 369 },
    "iphone|iPhone 13 Pro|battery":                         { from: 99, to: 159 },
    "iphone|iPhone 13 Pro|back-glass":                      { from: 129, to: 129 },
    "iphone|iPhone 13|screen":                              { from: 109, to: 359 },
    "iphone|iPhone 13|battery":                             { from: 89, to: 159 },
    "iphone|iPhone 13|back-glass":                          { from: 109, to: 109 },
    "iphone|iPhone 13 mini|screen":                         { from: 109, to: 359 },
    "iphone|iPhone 13 mini|battery":                        { from: 89, to: 159 },
    "iphone|iPhone 13 mini|back-glass":                     { from: 109, to: 109 },
    "iphone|iPhone 12 Pro Max|screen":                      { from: 109, to: 399 },
    "iphone|iPhone 12 Pro Max|battery":                     { from: 89, to: 159 },
    "iphone|iPhone 12 Pro Max|back-glass":                  { from: 119, to: 119 },
    "iphone|iPhone 12 Pro|screen":                          { from: 99, to: 359 },
    "iphone|iPhone 12 Pro|battery":                         { from: 89, to: 159 },
    "iphone|iPhone 12 Pro|back-glass":                      { from: 99, to: 99 },
    "iphone|iPhone 12|screen":                              { from: 99, to: 359 },
    "iphone|iPhone 12|battery":                             { from: 89, to: 159 },
    "iphone|iPhone 12|back-glass":                          { from: 99, to: 99 },
    "iphone|iPhone 12 mini|screen":                         { from: 99, to: 359 },
    "iphone|iPhone 12 mini|battery":                        { from: 89, to: 159 },
    "iphone|iPhone 12 mini|back-glass":                     { from: 99, to: 99 },
    "iphone|iPhone 11 Pro Max|screen":                      { from: 99, to: 159 },
    "iphone|iPhone 11 Pro Max|battery":                     { from: 89, to: 159 },
    "iphone|iPhone 11 Pro Max|back-glass":                  { from: 99, to: 99 },
    "iphone|iPhone 11 Pro|screen":                          { from: 99, to: 159 },
    "iphone|iPhone 11 Pro|battery":                         { from: 89, to: 159 },
    "iphone|iPhone 11 Pro|back-glass":                      { from: 99, to: 99 },
    "iphone|iPhone 11|screen":                              { from: 79, to: 159 },
    "iphone|iPhone 11|battery":                             { from: 89, to: 89 },
    "iphone|iPhone 11|back-glass":                          { from: 89, to: 89 },
    "iphone|iPhone XS Max|screen":                          { from: 79, to: 159 },
    "iphone|iPhone XS Max|battery":                         { from: 89, to: 89 },
    "iphone|iPhone XS Max|back-glass":                      { from: 99, to: 99 },
    "iphone|iPhone XS|screen":                              { from: 79, to: 159 },
    "iphone|iPhone XS|battery":                             { from: 79, to: 79 },
    "iphone|iPhone XS|back-glass":                          { from: 89, to: 89 },
    "iphone|iPhone X|screen":                               { from: 79, to: 159 },
    "iphone|iPhone X|battery":                              { from: 79, to: 79 },
    "iphone|iPhone X|back-glass":                           { from: 89, to: 89 },
    "iphone|iPhone XR|screen":                              { from: 79, to: 159 },
    "iphone|iPhone XR|battery":                             { from: 79, to: 79 },
    "iphone|iPhone XR|back-glass":                          { from: 89, to: 89 },
    "iphone|iPhone 8 Plus|screen":                          { from: 79, to: 159 },
    "iphone|iPhone 8 Plus|battery":                         { from: 79, to: 79 },
    "iphone|iPhone 8 Plus|back-glass":                      { from: 89, to: 89 },
    "iphone|iPhone 8|screen":                               { from: 79, to: 159 },
    "iphone|iPhone 8|back-glass":                           { from: 89, to: 89 },
    "iphone|iPhone SE (2nd or 3rd gen)|screen":             { from: 79, to: 159 },
    "iphone|iPhone SE (2nd or 3rd gen)|back-glass":         { from: 89, to: 89 },
    "iphone|iPhone 7 Plus|screen":                      { from: 59, to: 59 },
    "iphone|iPhone 7|screen":                           { from: 59, to: 59 },
    "iphone|iPhone 6s Plus / 6 Plus|screen":            { from: 59, to: 59 },
    "iphone|iPhone 6s / 6|screen":                      { from: 59, to: 59 },
    "iphone|iPhone 8|battery":                              { from: 89, to: 89 },
    "iphone|iPhone SE (2nd or 3rd gen)|battery":            { from: 89, to: 89 },
    // Samsung, Motorola, iPad and PS5 estimates (owner, 2026-11-12)
    "samsung|Galaxy S25 Ultra|screen":                      { from: 159, to: 369 },
    "samsung|Galaxy S25 Ultra|battery":                     { from: 59, to: 189 },
    "samsung|Galaxy S25+|screen":                           { from: 159, to: 369 },
    "samsung|Galaxy S25+|battery":                          { from: 59, to: 189 },
    "samsung|Galaxy S25|screen":                            { from: 159, to: 369 },
    "samsung|Galaxy S25|battery":                           { from: 59, to: 189 },
    "samsung|Galaxy S25 FE|screen":                         { from: 159, to: 369 },
    "samsung|Galaxy S25 FE|battery":                        { from: 59, to: 189 },
    "samsung|Galaxy S24 Ultra|screen":                      { from: 159, to: 369 },
    "samsung|Galaxy S24 Ultra|battery":                     { from: 59, to: 189 },
    "samsung|Galaxy S24+|screen":                           { from: 159, to: 369 },
    "samsung|Galaxy S24+|battery":                          { from: 59, to: 189 },
    "samsung|Galaxy S24|screen":                            { from: 159, to: 369 },
    "samsung|Galaxy S24|battery":                           { from: 59, to: 189 },
    "samsung|Galaxy S24 FE|screen":                         { from: 159, to: 369 },
    "samsung|Galaxy S24 FE|battery":                        { from: 59, to: 189 },
    "samsung|Galaxy S23 Ultra|screen":                      { from: 159, to: 369 },
    "samsung|Galaxy S23 Ultra|battery":                     { from: 59, to: 189 },
    "samsung|Galaxy S23+|screen":                           { from: 159, to: 369 },
    "samsung|Galaxy S23+|battery":                          { from: 59, to: 189 },
    "samsung|Galaxy S23|screen":                            { from: 159, to: 369 },
    "samsung|Galaxy S23|battery":                           { from: 59, to: 189 },
    "samsung|Galaxy S23 FE|screen":                         { from: 159, to: 369 },
    "samsung|Galaxy S23 FE|battery":                        { from: 59, to: 189 },
    "samsung|Galaxy S22 Ultra|screen":                      { from: 159, to: 369 },
    "samsung|Galaxy S22 Ultra|battery":                     { from: 59, to: 189 },
    "samsung|Galaxy S22+|screen":                           { from: 159, to: 369 },
    "samsung|Galaxy S22+|battery":                          { from: 59, to: 189 },
    "samsung|Galaxy S22|screen":                            { from: 159, to: 369 },
    "samsung|Galaxy S22|battery":                           { from: 59, to: 189 },
    "samsung|Galaxy S21 Ultra|screen":                      { from: 159, to: 369 },
    "samsung|Galaxy S21 Ultra|battery":                     { from: 59, to: 189 },
    "samsung|Galaxy S21+|screen":                           { from: 159, to: 369 },
    "samsung|Galaxy S21+|battery":                          { from: 59, to: 189 },
    "samsung|Galaxy S21|screen":                            { from: 159, to: 369 },
    "samsung|Galaxy S21|battery":                           { from: 59, to: 189 },
    "samsung|Galaxy S21 FE|screen":                         { from: 159, to: 369 },
    "samsung|Galaxy S21 FE|battery":                        { from: 59, to: 189 },
    "samsung|Galaxy Z Fold (any)|screen":                   { from: 299, to: 859 },
    "samsung|Galaxy Z Flip (any)|screen":                   { from: 299, to: 859 },
    "phone-other|Motorola|screen":                          { from: 89, to: 259 },
    "phone-other|Motorola|battery":                         { from: 89, to: 159 },
    "tablet|iPad Pro|screen":                               { from: 99, to: 839 },
    "tablet|iPad Pro|battery":                              { from: 129, to: 299 },
    "tablet|iPad Air|screen":                               { from: 99, to: 839 },
    "tablet|iPad Air|battery":                              { from: 129, to: 299 },
    "tablet|iPad (standard)|screen":                        { from: 99, to: 839 },
    "tablet|iPad (standard)|battery":                       { from: 129, to: 299 },
    "tablet|iPad mini|screen":                              { from: 99, to: 839 },
    "tablet|iPad mini|battery":                             { from: 129, to: 299 },
    "console|PlayStation 5|hdmi":                           { from: 99, to: 259 },
    "console|PlayStation 5|power":                          { from: 99, to: 259 },
    "console|PlayStation 5|overheating":                    { from: 99, to: 259 },
    "console|PlayStation 5|other":                          { from: 99, to: 259 },
    "console|PlayStation 5|controller":                     { from: 99, to: 259 },
    // A-series, Note, Pixel, Galaxy Tab, laptops, charging port and camera (owner, 2026-11-12)
    "samsung|Galaxy A-series (A15, A25, A35, A55…)|screen": { from: 99, to: 189 },
    "samsung|Galaxy A-series (A15, A25, A35, A55…)|battery": { from: 79, to: 159 },
    "samsung|Galaxy Note (any)|screen":                     { from: 159, to: 399 },
    "samsung|Galaxy Note (any)|battery":                    { from: 89, to: 199 },
    "phone-other|Google Pixel|screen":                      { from: 129, to: 359 },
    "tablet|Samsung Galaxy Tab|screen":                     { from: 99, to: 359 },
    "laptop|MacBook Air|screen":                            { from: 150, to: 899 },
    "laptop|MacBook Pro|screen":                            { from: 150, to: 899 },
    "laptop|Windows laptop|screen":                         { from: 150, to: 899 },
    "laptop|Chromebook|screen":                             { from: 150, to: 899 },
    "laptop|Other laptop|screen":                           { from: 150, to: 899 },
    "iphone|*|charging-port":                               { from: 99, to: 259 },
    "samsung|*|charging-port":                              { from: 99, to: 259 },
    "phone-other|*|charging-port":                          { from: 99, to: 259 },
    "tablet|*|charging-port":                               { from: 99, to: 259 },
    "laptop|*|charging-port":                               { from: 99, to: 259 },
    "iphone|*|camera":                                      { from: 99, to: 359 },
    "samsung|*|camera":                                     { from: 99, to: 359 },
    "phone-other|*|camera":                                 { from: 99, to: 359 },
    "tablet|*|camera":                                      { from: 99, to: 359 }
  },

  // ---- Part quality choices (aftermarket or genuine) ----
  // Repairs that replace a part get a choice. iPhone screens get
  // LCD / OLED / Genuine Apple; everything else gets Aftermarket / Genuine <brand>.
  partRepairs: ["screen", "battery", "charging-port", "camera", "back-glass", "speaker", "keyboard"],
  partDevices: ["iphone", "samsung", "phone-other", "tablet", "laptop", "watch"],
  // iPhones that came with an LCD screen: an OLED replacement isn't offered.
  lcdModels: ["iPhone 11", "iPhone XR", "iPhone SE (2nd or 3rd gen)", "iPhone 8 Plus", "iPhone 8", "iPhone 7 Plus", "iPhone 7", "iPhone 6s Plus / 6 Plus", "iPhone 6s / 6"],

  // "Genuine ___" label for a device + model
  genuineLabel: function (device, model) {
    var m = model || "";
    if (device === "iphone" || /iPad|MacBook|Apple Watch/.test(m)) return "Genuine Apple";
    if (device === "samsung" || /Samsung|Galaxy/.test(m)) return "Genuine Samsung";
    if (/Google|Pixel/.test(m)) return "Genuine Google";
    var brand = (m.match(/^(Motorola|OnePlus|LG|TCL|Amazon)/) || [])[1];
    return brand ? "Genuine " + brand : "Genuine (original)";
  },

  // The choices for a device + model + repair, or null when there's no choice
  partChoices: function (device, model, repair) {
    if (this.partDevices.indexOf(device) < 0 || this.partRepairs.indexOf(repair) < 0) return null;
    if (device === "iphone" && repair === "screen") {
      var lcdOnly = this.lcdModels.indexOf(model) >= 0;
      return [{ id: "lcd", label: "Aftermarket LCD" }]
        .concat(lcdOnly ? [] : [{ id: "oled", label: "Aftermarket OLED" }])
        .concat([{ id: "genuine", label: "Genuine Apple" }]);
    }
    return [{ id: "aftermarket", label: "Aftermarket" }, { id: "genuine", label: this.genuineLabel(device, model) }];
  }
};
