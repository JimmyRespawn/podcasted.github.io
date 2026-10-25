let miniPlayerWindow = null;

function closePlayerMoreMenu(returnFocus = false) {
  document.getElementById("playerMoreMenu").hidden = true;
  document.getElementById("playerMoreButton").setAttribute("aria-expanded", "false");
  if (returnFocus) document.getElementById("playerMoreButton").focus();
}

function initializePlayerMoreMenu() {
  const toggle = document.getElementById("playerMoreButton");
  const menu = document.getElementById("playerMoreMenu");
  const mini = document.getElementById("miniPlayerButton");
  mini.disabled = !window.isSecureContext || typeof window.documentPictureInPicture?.requestWindow !== "function";
  const updateMiniLabel = () => {
    mini.textContent = t(miniPlayerWindow && !miniPlayerWindow.closed ? "Close Mini Player" : "Mini Player");
    mini.title = mini.disabled ? t("Mini Player is not supported in this browser.") : "";
  };
  toggle.onclick = () => {
    if (!menu.hidden) { closePlayerMoreMenu(true); return; }
    updateMiniLabel();
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    const anchor = toggle.getBoundingClientRect();
    const bounds = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(innerWidth - bounds.width - 8, anchor.right - bounds.width)) + "px";
    menu.style.top = Math.max(8, anchor.top - bounds.height - 8) + "px";
    menu.querySelector("button:not(:disabled)")?.focus();
  };
  document.getElementById("sleepTimerButton").onclick = () => {
    closePlayerMoreMenu();
    openSleepTimerSettings();
  };
  mini.onclick = () => {
    closePlayerMoreMenu(true);
    if (miniPlayerWindow && !miniPlayerWindow.closed) miniPlayerWindow.close();
    else openMiniPlayer();
  };
  menu.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closePlayerMoreMenu(true); }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const items = Array.from(menu.querySelectorAll("button:not(:disabled)"));
      const index = items.indexOf(document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
        : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
    if (event.key === "Tab") closePlayerMoreMenu();
  });
  document.addEventListener("pointerdown", event => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) closePlayerMoreMenu();
  });
  window.addEventListener("resize", () => closePlayerMoreMenu());
  document.getElementById("contentScroll").addEventListener("scroll", () => closePlayerMoreMenu());
  window.addEventListener("podcastedlanguagechange", updateMiniLabel);
  window.addEventListener("pagehide", () => miniPlayerWindow?.close());
  updateMiniLabel();
}

async function openMiniPlayer() {
  try {
    const pip = await window.documentPictureInPicture.requestWindow({width: 360, height: 360});
    miniPlayerWindow = pip;
    const doc = pip.document;
    doc.title = "Podcasted";
    const style = doc.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; }
      body { margin: 0; font: 14px "Segoe UI", system-ui, sans-serif; background: #181818; color: #fff; color-scheme: dark; }
      .info, .art { position: absolute; inset: 0; }
      .art { display: grid; place-items: center; background: radial-gradient(ellipse at top, #41414a, #181818 75%); color: #b5b5bf; }
      .art > svg { width: 28%; height: 28%; opacity: .55; }
      .art img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.72), rgba(0,0,0,.2) 38%, rgba(0,0,0,.42) 65%, rgba(0,0,0,.9)); }
      .copy { position: absolute; left: 18px; right: 18px; top: 18px; min-width: 0; text-shadow: 0 1px 5px #000; }
      h1 { font-size: clamp(14px, 4vw, 18px); font-weight: 500; line-height: 1.4; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      p { margin: 6px 0 0; font-size: 12px; color: rgba(255,255,255,.78); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .transport { position: absolute; top: 53%; left: 50%; transform: translate(-50%, -50%); display: flex; justify-content: center; align-items: center; gap: clamp(16px, 7vw, 30px); }
      button { display: grid; place-items: center; flex-shrink: 0; background: transparent; color: #fff; border: 0; border-radius: 50%; width: 44px; height: 44px; padding: 0; cursor: pointer; transition: background .15s, transform .15s; }
      button:hover { background: rgba(255,255,255,.15); transform: scale(1.06); }
      button svg { width: 32px; height: 32px; }
      .primary-play { width: 64px; height: 64px; background: #fff; color: #111; box-shadow: 0 4px 24px rgba(0,0,0,.25); }
      .primary-play:hover { background: #fff; }
      .primary-play svg { width: 36px; height: 36px; }
      button:disabled, input:disabled { opacity: .45; cursor: default; }
      button:focus-visible, input:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }
      .timeline { position: absolute; bottom: 8px; left: 12px; right: 12px; }
      .times { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; font-variant-numeric: tabular-nums; color: rgba(255,255,255,.9); }
      input[type=range] { display: block; appearance: none; -webkit-appearance: none; width: 100%; height: 18px; margin: 0; background: transparent; cursor: pointer; }
      input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 4px; background: linear-gradient(to right, #fff var(--played, 0%), rgba(255,255,255,.35) var(--played, 0%)); }
      input[type=range]::-webkit-slider-thumb { appearance: none; -webkit-appearance: none; width: 10px; height: 10px; margin-top: -3px; border-radius: 50%; background: #fff; }
      .copy, .scrim, .transport, .timeline { opacity: 0; transition: opacity .22s ease; }
      .copy, .transport, .timeline { pointer-events: none; }
      .controls-visible :is(.copy, .scrim, .transport, .timeline), .no-art :is(.copy, .scrim, .transport, .timeline) { opacity: 1; }
      .controls-visible :is(.transport, .timeline), .no-art :is(.transport, .timeline) { pointer-events: auto; }
      @media (max-height: 230px) { .copy { top: 10px; left: 12px; right: 12px; } h1 { -webkit-line-clamp: 1; font-size: 14px; } p { margin-top: 2px; } .primary-play { width: 48px; height: 48px; } .primary-play svg { width: 28px; height: 28px; } .transport { top: 55%; } }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; } }
    `;
    doc.head.appendChild(style);
    const info = doc.createElement("div");
    info.className = "info";
    const artwork = doc.createElement("div");
    artwork.className = "art";
    const copy = doc.createElement("div");
    copy.className = "copy";
    const title = doc.createElement("h1");
    const subtitle = doc.createElement("p");
    copy.append(title, subtitle);
    const scrim = doc.createElement("div");
    scrim.className = "scrim";
    scrim.setAttribute("aria-hidden", "true");
    info.append(artwork, scrim, copy);
    const controls = doc.createElement("div");
    controls.className = "transport";
    const button = (icon, action) => {
      const element = doc.createElement("button");
      element.type = "button";
      element.innerHTML = fluentIcon(icon);
      element.onclick = action;
      controls.appendChild(element);
      return element;
    };
    const back = button("skipBack", seekBackward);
    const play = button("play", togglePlayback);
    play.className = "primary-play";
    const forward = button("skipForward", seekForward);
    const progress = doc.createElement("input");
    progress.type = "range";
    progress.min = "0";
    progress.max = "100";
    progress.step = "0.1";
    const times = doc.createElement("div");
    times.className = "times";
    const elapsed = doc.createElement("span"), remaining = doc.createElement("span");
    times.append(elapsed, remaining);
    const timeline = doc.createElement("div");
    timeline.className = "timeline";
    timeline.append(times, progress);
    doc.body.append(info, controls, timeline);
    const audio = document.getElementById("player");
    let lastCover = null;
    const sync = () => {
      const root = getComputedStyle(document.documentElement);
      [["--bg", "--surface"], ["--fg", "--text"], ["--muted", "--text-muted"], ["--track", "--input-bg"], ["--accent", "--focus"]].forEach(([name, source]) => doc.documentElement.style.setProperty(name, root.getPropertyValue(source)));
      doc.documentElement.lang = document.documentElement.lang;
      doc.documentElement.style.colorScheme = "dark";
      title.textContent = playingEpisode?.title || t("Choose an episode to start listening");
      subtitle.textContent = playingPodcastInfo?.title || "Podcasted";
      const cover = playingPodcastInfo?.cover || "";
      if (cover !== lastCover) {
        lastCover = cover;
        artwork.innerHTML = fluentIcon("music");
        doc.body.classList.toggle("no-art", !cover);
        if (cover) {
          const image = doc.createElement("img");
          image.alt = "";
          image.src = cover;
          image.onerror = () => { image.remove(); doc.body.classList.add("no-art"); };
          image.onload = () => doc.body.classList.remove("no-art");
          artwork.appendChild(image);
        }
      }
      const active = !audio.paused && !audio.ended;
      play.innerHTML = fluentIcon(active ? "pause" : "play");
      [[back, "Back 15 seconds"], [play, active ? "Pause" : "Play"], [forward, "Forward 30 seconds"]].forEach(([element, label]) => { element.title = t(label); element.setAttribute("aria-label", t(label)); element.disabled = !audio.getAttribute("src"); });
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      progress.disabled = duration <= 0;
      progress.value = String(duration ? audio.currentTime / duration * 100 : 0);
      progress.style.setProperty("--played", progress.value + "%");
      progress.setAttribute("aria-label", t("Playback position"));
      elapsed.textContent = formatPodcastDuration(String(Math.floor(audio.currentTime || 0)));
      remaining.textContent = "-" + formatPodcastDuration(String(Math.floor(Math.max(0, duration - audio.currentTime))));
    };
    progress.oninput = () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(progress.value) / 100 * audio.duration; };
    let hideControlsTimer;
    let dragging = false;
    const hideControls = () => {
      if (!dragging && !doc.querySelector(":focus-visible")) doc.body.classList.remove("controls-visible");
    };
    const revealControls = () => {
      doc.body.classList.add("controls-visible");
      clearTimeout(hideControlsTimer);
      hideControlsTimer = setTimeout(hideControls, 2600);
    };
    doc.addEventListener("pointermove", revealControls);
    doc.addEventListener("pointerdown", revealControls);
    doc.addEventListener("keydown", revealControls);
    doc.addEventListener("focusin", revealControls);
    doc.addEventListener("focusout", revealControls);
    doc.documentElement.addEventListener("pointerleave", hideControls);
    progress.addEventListener("pointerdown", () => { dragging = true; });
    doc.addEventListener("pointerup", () => { dragging = false; revealControls(); });
    doc.addEventListener("pointercancel", () => { dragging = false; revealControls(); });
    revealControls();
    const mediaEvents = ["timeupdate", "play", "pause", "ended", "loadedmetadata", "durationchange", "emptied"];
    const appEvents = ["podcastedplayerchange", "podcastedlanguagechange", "podcastedthemechange"];
    mediaEvents.forEach(event => audio.addEventListener(event, sync));
    appEvents.forEach(event => window.addEventListener(event, sync));
    pip.addEventListener("pagehide", () => {
      clearTimeout(hideControlsTimer);
      mediaEvents.forEach(event => audio.removeEventListener(event, sync));
      appEvents.forEach(event => window.removeEventListener(event, sync));
      if (miniPlayerWindow === pip) miniPlayerWindow = null;
    }, {once: true});
    sync();
  } catch (error) {
    console.error("Mini Player:", error);
    miniPlayerWindow?.close();
    miniPlayerWindow = null;
    showPlayerStatus("Unable to open Mini Player. Please try again.", "error");
  }
}
