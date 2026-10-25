let resetMobileHeader = () => {};

function initializeMobileHeader() {
  const scroller = document.getElementById("contentScroll");
  const header = document.querySelector(".sidebar");
  const narrow = matchMedia("(max-width: 600px)");
  let previous = scroller.scrollTop;
  let direction = 0;
  let distance = 0;
  let ignoreUntil = 0;

  function setCollapsed(collapsed) {
    if (document.body.classList.contains("mobile-header-hidden") === collapsed) return;
    document.body.classList.toggle("mobile-header-hidden", collapsed);
    header.inert = collapsed || document.body.classList.contains("player-expanded");
    distance = 0;
    // The changing viewport height can itself adjust scrollTop at the bottom.
    ignoreUntil = performance.now() + 240;
  }

  resetMobileHeader = () => {
    setCollapsed(false);
    direction = 0;
    distance = 0;
    previous = scroller.scrollTop;
  };

  function measureHeader() {
    header.style.transition = "none";
    resetMobileHeader();
    header.style.removeProperty("--mobile-header-size");
    if (narrow.matches) header.style.setProperty("--mobile-header-size", header.scrollHeight + 1 + "px");
    header.getBoundingClientRect();
    requestAnimationFrame(() => header.style.removeProperty("transition"));
  }

  scroller.addEventListener("scroll", () => {
    const top = Math.max(0, scroller.scrollTop);
    const delta = top - previous;
    previous = top;
    if (!narrow.matches || document.body.classList.contains("player-expanded")) return;
    if (top <= 12) { setCollapsed(false); return; }
    if (performance.now() < ignoreUntil || Math.abs(delta) < 1) return;
    const nextDirection = Math.sign(delta);
    if (nextDirection !== direction) { direction = nextDirection; distance = 0; }
    distance += Math.abs(delta);
    if (direction > 0 && top > 80 && distance >= 32) {
      // Keep navigation visible while it is being operated with the keyboard.
      if (!header.querySelector(":focus-visible")) setCollapsed(true);
    } else if (direction < 0 && distance >= 16) setCollapsed(false);
  }, {passive: true});
  narrow.addEventListener("change", measureHeader);
  window.addEventListener("resize", measureHeader);
  measureHeader();
}
