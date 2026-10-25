// Local sleep timer and keyboard controls; no server is required.
(() => {
  const storageKey = "podcasted.sleep-timer.v1";
  const presets = [15, 30, 45, 60, 90];
  let deadline = 0;
  let minutes = 0;
  let interval;
  let syncingPicker = false;

  function syncPicker() {
    syncingPicker = true;
    document.getElementById("sleepTimerPicker").value = String(minutes);
    syncingPicker = false;
  }

  function updateTimerDisplay() {
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    const time = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
    document.getElementById("sleepTimerStatus").textContent = deadline
      ? t("Playback pauses in {time}. Choose Off to cancel.", {time}) : t("Pause playback after a set time.");
    const button = document.getElementById("sleepTimerButton");
    button.dataset.active = String(Boolean(deadline));
    document.querySelector("#playerMoreButton .timer-active-dot").hidden = !deadline;
    button.title = deadline ? t("Sleep timer: {time} remaining", {time}) : t("Sleep timer");
    button.setAttribute("aria-label", button.title);
    const label = document.getElementById("sleepTimerLabel");
    label.hidden = !deadline;
    label.textContent = remaining >= 60 ? `${Math.ceil(remaining / 60)}m` : time;
  }

  function stopTimer() {
    clearInterval(interval);
    interval = undefined;
    deadline = 0;
    minutes = 0;
    try { localStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
    syncPicker();
    updateTimerDisplay();
  }

  function checkTimer() {
    if (deadline && Date.now() >= deadline) {
      stopTimer();
      document.getElementById("player").pause();
      savePlaybackState();
      showPlayerStatus("Sleep timer finished. Playback paused.");
      return;
    }
    updateTimerDisplay();
  }

  function startTimer(value) {
    const selected = Number(value);
    if (selected !== 0 && !presets.includes(selected)) return;
    stopTimer();
    if (!selected) return;
    minutes = selected;
    deadline = Date.now() + minutes * 60000;
    try { localStorage.setItem(storageKey, JSON.stringify({ deadline, minutes })); } catch { /* Optional persistence. */ }
    syncPicker();
    updateTimerDisplay();
    interval = setInterval(checkTimer, 1000);
  }

  window.openSleepTimerSettings = () => {
    setExpandedPlayer(false);
    showSettings();
    document.getElementById("sleepTimerSetting").scrollIntoView({ block: "center", behavior: "smooth" });
    document.getElementById("sleepTimerPicker").focus();
  };

  window.initializePlayerTools = () => {
    const player = document.getElementById("player");
    document.getElementById("sleepTimerPicker").addEventListener("change", event => {
      if (!syncingPicker) startTimer(event.currentTarget.value);
    });
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Number.isFinite(saved?.deadline) && presets.includes(saved.minutes)) {
        deadline = saved.deadline;
        minutes = saved.minutes;
        syncPicker();
        checkTimer();
        if (deadline) interval = setInterval(checkTimer, 1000);
      }
    } catch { /* Missing or invalid saved timers are ignored. */ }
    window.addEventListener("podcastedlanguagechange", updateTimerDisplay);
    updateTimerDisplay();
    player.addEventListener("play", checkTimer);
    document.addEventListener("visibilitychange", checkTimer);
    window.addEventListener("pageshow", checkTimer);

    document.addEventListener("keydown", event => {
      if (event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, select, fluent-text-input, fluent-dropdown, fluent-slider, fluent-listbox, [contenteditable]:not([contenteditable="false"])')) return;
      if (event.key === " " && target instanceof Element && target.closest("button, a, fluent-button")) return;
      const key = event.key.toLowerCase();
      if (key === "/" && document.querySelector("dialog[open]")) return;
      const hasAudio = Boolean(player.getAttribute("src"));
      const actions = {
        "/": () => {
          closePlayerMoreMenu();
          setExpandedPlayer(false);
          resetMobileHeader();
          document.getElementById("searchInput").focus();
        },
        " ": () => { if (hasAudio) togglePlayback(); },
        k: () => { if (hasAudio) togglePlayback(); },
        arrowleft: () => { if (hasAudio) seekBackward(); },
        arrowright: () => { if (hasAudio) seekForward(); },
        arrowup: () => { player.volume = Math.min(1, player.volume + 0.05); player.muted = false; },
        arrowdown: () => { player.volume = Math.max(0, player.volume - 0.05); },
        m: () => document.getElementById("muteButton").click(),
        f: () => setExpandedPlayer(!document.getElementById("audioPlayerPanel").classList.contains("is-expanded")),
      };
      if (!actions[key]) return;
      if (!hasAudio && [" ", "k", "arrowleft", "arrowright"].includes(key)) return;
      event.preventDefault();
      actions[key]();
    });
  };
})();
