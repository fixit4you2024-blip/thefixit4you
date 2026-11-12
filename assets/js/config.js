/* ==========================================================================
   Fixit4U — business settings
   Edit this file to change contact details, hours, reviews and the form
   destination. Every page reads from here, so a change shows up everywhere.
   (If you change hours, also update the "openingHoursSpecification" block
   near the top of index.html and contact.html so Google sees the same hours.)
   ========================================================================== */
window.FIXIT = {
  name: "Fixit4U",
  phoneDisplay: "(334) 849-0404",
  phoneHref: "tel:+13348490404",
  email: "info@thefixit4you.com",
  address: {
    street: "1111 S College St, Ste 200 A",
    city: "Auburn",
    state: "AL",
    zip: "36832"
  },

  // Google Maps links (no API key needed)
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Fixit4U%2C+1111+S+College+St+Ste+200+A%2C+Auburn%2C+AL+36832",
  directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=1111+S+College+St+Ste+200+A%2C+Auburn%2C+AL+36832",

  // Times are 24-hour "HH:MM", shop time zone. Use null for closed days.
  timeZone: "America/Chicago",
  hours: [
    { day: "Monday",    open: null,    close: null },
    { day: "Tuesday",   open: "09:00", close: "19:00" },
    { day: "Wednesday", open: "09:00", close: "19:00" },
    { day: "Thursday",  open: "09:00", close: "19:00" },
    { day: "Friday",    open: "09:00", close: "19:00" },
    { day: "Saturday",  open: "09:00", close: "19:00" },
    { day: "Sunday",    open: "10:00", close: "17:00" }
  ],

  // Quote / appointment form delivery.
  // FormSubmit forwards each request to the email below. The very first
  // submission sends an "Activate Form" email to that inbox — click it once.
  form: {
    endpoint: "https://formsubmit.co/ajax/info@thefixit4you.com"
  },

  // Reviews ------------------------------------------------------------
  reviews: {
    // Your Google Business listing
    googleUrl: "https://maps.google.com/?cid=8061502235643205965",
    // Paste your "Ask for reviews" link from Google Business Profile here:
    writeReviewUrl: "https://g.page/r/CU3Zh1eSNeBvEAE/review",

    // Rating shown on the site. Update it now and then from your Google
    // listing. (With an API key below, it updates itself automatically.)
    summary: { rating: 4.9, count: 192 },

    // LIVE GOOGLE REVIEWS: paste a Google Maps API key (with "Places API (New)"
    // and "Maps JavaScript API" enabled, restricted to your website address)
    // and the site will pull your newest good reviews straight from Google.
    googleApiKey: "",
    placeId: "",           // optional; found automatically from placeQuery
    placeQuery: "Fixit4U, 1111 S College St Ste 200 A, Auburn, AL 36832",
    minRating: 4,          // only show reviews with this many stars or more
    max: 12,               // how many review cards to show (4+ turns into a sliding carousel)

    // Or paste reviews by hand (exact text from Google). These show when
    // there's no API key.
    items: [
      // headline: a short phrase copied word for word from the review (optional)
      { author: "Joey Smallwood", rating: 5, date: "2026-10-27", source: "Google", headline: "Treat you like family",
        text: "Great customer service, very kind, friendly, nice atmosphere, great prices and very reasonable and respectful! Highly recommended! Phones-IPads-Laptops(No-Desktops)-Game Controllers-Game Consoles! They take care of most things and treat you like family!" },
      { author: "Patience Melius", rating: 5, date: "2026-10-06", source: "Google", headline: "Super affordable",
        text: "Hasan was extremely helpful. My new screen and case are perfect and were super affordable. Highest recommendations 💯" },
      { author: "Christian Bowling", rating: 5, date: "2026-10-06", source: "Google", headline: "Back on in 15 minutes",
        text: "Phone wouldn't cut on, and screen was blacked out. They had it back on in 15 minutes if that. Also cut me a deal I only had to pay half the service fee. Highly recommend, great customer service, real knowledgeable, and quick." },
      { author: "Gio Versace", rating: 5, date: "2026-09-22", source: "Google", headline: "Working again in less than 15 minutes",
        text: "My iPhone screen unexpectedly stopped working, so I needed to find somewhere that could get it taken care of quickly. I called Fixit4U and was immediately impressed by the customer service. They gave me a fair and reasonable price quote upfront, which I really appreciated.\n\nOnce I arrived, the technician was extremely helpful, knowledgeable, and professional. The repair itself was incredibly fast my screen was fixed and fully working again in less than 15 minutes! I honestly expected to have to wait much longer, so the quick turnaround was a huge plus.\n\nWhat stood out most was the combination of great customer service, fair pricing, and efficiency. My phone was repaired properly, everything was explained clearly, and I left completely satisfied.\n\nIf you need an iPhone or other device repaired, I would definitely recommend Fixit4U. They made an unexpected and inconvenient situation extremely easy to deal with." },
      { author: "Mohammed Ahmed", rating: 5, date: "2026-09-15", source: "Google", headline: "Works like new",
        text: "Excellent service! The screen on my phone was repaired quickly and works like new. The technician was extremely knowledgeable, honest, and great to deal with. Highly recommend!" },
      { author: "Bao Han Cao", rating: 5, date: "2026-06-23", source: "Google", headline: "The most affordable diagnostic rate",
        text: "I came in to seek help with my laptop, and he offered the most affordable diagnostic rate compared to other repair shops in town, which was especially helpful for a student like me. After diagnosing a motherboard issue, he explained the problem and walk me through the options for retrieving my data.\n\nI really appreciated his honesty and quick service throughout the process. I would definitely come back here if I ever need help with tech stuff in the future." },
      { author: "Yumi Jeong", rating: 5, date: "2026-06-09", source: "Google", headline: "Extremely friendly and professional",
        text: "I had a great experience at Fixit4U. Hassan was extremely friendly and professional throughout the entire process.\n\nSince my English is limited, he kindly used a translator to make sure I understood everything. He clearly explained the battery replacement process, the cost, and the 90-day warranty. After the replacement, he also checked and showed me the battery health right away.\n\nThe service was completed much faster than I expected, and the quality of the work was excellent. I truly appreciated Hassan's patience and willingness to help.\n\nI will definitely come back to Fixit4U for any future phone repairs and highly recommend this shop to others. Thank you, Hassan!" },
      // Example format (delete the slashes to use):
      // { author: "First name L.", rating: 5, date: "2026-10-02", text: "Exact review text from Google.", source: "Google" }
    ]
  }
};
