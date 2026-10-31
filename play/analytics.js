(function () {
  // Keep local previews out of production statistics.
  if (location.protocol !== "https:" || location.hostname !== "podcasted.linjimi.com") return;

  const measurementId = "G-9MWZQQR0Y";
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  // Subscription imports and feed URLs should not be included in page URLs.
  window.gtag("config", measurementId, {
    page_location: location.origin + location.pathname,
    page_title: "Podcasted - Web Player"
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
  document.head.appendChild(script);
})();
