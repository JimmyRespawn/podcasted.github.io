const queueStorageKey = "podcasted.queue.v1";
let episodeQueue = [];
const queueAddIcon = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

function saveQueue() {
  try { localStorage.setItem(queueStorageKey, JSON.stringify(episodeQueue)); } catch { /* Queue still works during this visit. */ }
  renderQueue();
  updateQueueControls();
}

function isInQueue(audioUrl) {
  return (playingEpisode?.audioUrl === audioUrl && Boolean(document.getElementById("player").getAttribute("src")) && !document.getElementById("player").ended)
    || episodeQueue.some(item => item.audioUrl === audioUrl);
}

function syncQueueCurrentEpisode() {
  const remaining = episodeQueue.filter(item => item.audioUrl !== playingEpisode?.audioUrl);
  if (remaining.length !== episodeQueue.length) { episodeQueue = remaining; saveQueue(); }
  else { renderQueue(); updateQueueControls(); }
}

function addToQueue(episode) {
  if (!episode?.audioUrl || !isValidUrl(episode.audioUrl) || isInQueue(episode.audioUrl)) return;
  episodeQueue.push({...episode, podcast: episode.podcast ? {...episode.podcast} : null});
  saveQueue();
  showPlayerStatus("Added to queue.");
}

function createQueueAddButton(episode) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "episode-queue-add";
  button.dataset.audio = episode.audioUrl;
  button.innerHTML = queueAddIcon;
  button.disabled = isInQueue(episode.audioUrl);
  button.title = t(button.disabled ? "Already in queue" : "Add to queue");
  button.setAttribute("aria-label", button.title + ": " + episode.title);
  button.onclick = event => { event.stopPropagation(); addToQueue(episode); };
  return button;
}

function updateQueueControls() {
  const count = document.getElementById("queueCount");
  count.textContent = String(episodeQueue.length);
  count.hidden = !episodeQueue.length;
  document.querySelectorAll(".episode-queue-add").forEach(button => {
    button.disabled = isInQueue(button.dataset.audio);
    button.title = t(button.disabled ? "Already in queue" : "Add to queue");
    button.setAttribute("aria-label", button.title);
  });
  const detail = document.getElementById("addDetailToQueue");
  detail.disabled = !visibleEpisode?.audioUrl || isInQueue(visibleEpisode.audioUrl);
  detail.textContent = t(detail.disabled && visibleEpisode?.audioUrl ? "Already in queue" : "Add to queue");
}

function playQueuedEpisode(index = 0) {
  if (!episodeQueue[index]) return;
  const [episode] = episodeQueue.splice(index, 1);
  saveQueue();
  playEpisode(episode.audioUrl, episode.title, episode, 0);
}

function showQueue(addHistory = true) {
  setExpandedPlayer(false);
  if (addHistory) recordPage({type: "queue", query: ""});
  ++feedRequestId;
  ++searchRequestId;
  setNavigationView("queue");
  document.getElementById("searchDiv").hidden = true;
  document.getElementById("podcastDetail").hidden = true;
  renderQueue();
  document.getElementById("contentScroll").scrollTo({top: 0});
}

function renderQueue() {
  const list = document.getElementById("queueList");
  list.replaceChildren();
  const player = document.getElementById("player");
  const current = playingEpisode?.audioUrl && player.getAttribute("src") && !player.ended ? playingEpisode : null;
  document.getElementById("queueEmpty").hidden = episodeQueue.length > 0 || Boolean(current);
  document.getElementById("queuePlay").disabled = !episodeQueue.length;
  document.getElementById("queueClear").hidden = !episodeQueue.length;
  if (current) {
    const row = document.createElement("li");
    row.className = "queue-current" + (player.paused ? " is-paused" : "");
    row.setAttribute("aria-current", "true");
    const artwork = document.createElement("div");
    artwork.className = "queue-current-cover";
    artwork.innerHTML = fluentIcon("music");
    if (current.podcast?.cover) {
      const image = document.createElement("img");
      image.src = current.podcast.cover;
      image.alt = "";
      image.onerror = () => image.remove();
      artwork.appendChild(image);
    }
    const copy = document.createElement("div");
    copy.className = "episode-copy";
    const badge = document.createElement("p");
    badge.className = "queue-current-label";
    const indicator = document.createElement("span");
    indicator.className = "queue-playing-indicator";
    indicator.setAttribute("aria-hidden", "true");
    indicator.innerHTML = "<i></i><i></i><i></i>";
    badge.append(indicator, document.createTextNode(t(player.paused ? "Paused" : "NOW PLAYING")));
    const title = document.createElement("button");
    title.type = "button";
    title.className = "episode-title episode-details-link";
    title.textContent = current.title;
    title.onclick = () => showEpisodeDetails(current);
    const subtitle = document.createElement("p");
    subtitle.className = "queue-subtitle";
    subtitle.textContent = [current.podcast?.title, current.duration].filter(Boolean).join(" · ");
    copy.append(badge, title, subtitle);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "queue-action queue-current-toggle";
    toggle.title = t(player.paused ? "Play" : "Pause");
    toggle.setAttribute("aria-label", toggle.title + ": " + current.title);
    toggle.innerHTML = fluentIcon(player.paused ? "play" : "pause");
    toggle.onclick = togglePlayback;
    row.append(artwork, copy, toggle);
    list.appendChild(row);
  }
  episodeQueue.forEach((episode, index) => {
    const li = document.createElement("li");
    const copy = document.createElement("div");
    copy.className = "episode-copy";
    const title = document.createElement("button");
    title.type = "button";
    title.className = "episode-title episode-details-link";
    title.textContent = episode.title;
    title.onclick = () => showEpisodeDetails(episode);
    const subtitle = document.createElement("p");
    subtitle.className = "queue-subtitle";
    subtitle.textContent = [episode.podcast?.title, episode.duration].filter(Boolean).join(" · ");
    copy.append(title, subtitle);
    const actions = document.createElement("div");
    actions.className = "queue-row-actions";
    function action(label, icon, handler, disabled = false) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "queue-action";
      button.title = t(label);
      button.setAttribute("aria-label", t(label) + ": " + episode.title);
      button.disabled = disabled;
      button.innerHTML = icon;
      button.onclick = handler;
      actions.appendChild(button);
    }
    const move = offset => {
      [episodeQueue[index], episodeQueue[index + offset]] = [episodeQueue[index + offset], episodeQueue[index]];
      saveQueue();
      document.querySelectorAll("#queueList li:not(.queue-current)")[index + offset]?.querySelector(".episode-details-link").focus();
    };
    action("Move up", '<span aria-hidden="true">↑</span>', () => move(-1), index === 0);
    action("Move down", '<span aria-hidden="true">↓</span>', () => move(1), index === episodeQueue.length - 1);
    action("Play episode", fluentIcon("play"), () => playQueuedEpisode(index));
    action("Remove from queue", '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>', () => {
      episodeQueue.splice(index, 1);
      saveQueue();
      const rows = document.querySelectorAll("#queueList li:not(.queue-current)");
      (rows[Math.min(index, rows.length - 1)]?.querySelector(".episode-details-link") || document.getElementById("queueNav")).focus();
    });
    li.append(copy, actions);
    list.appendChild(li);
  });
}

function initializeQueue() {
  try {
    const saved = JSON.parse(localStorage.getItem(queueStorageKey));
    const seen = new Set();
    if (Array.isArray(saved)) episodeQueue = saved.filter(item => {
      if (!item || typeof item.audioUrl !== "string" || !isValidUrl(item.audioUrl) || typeof item.title !== "string" || seen.has(item.audioUrl)) return false;
      seen.add(item.audioUrl);
      return true;
    });
  } catch { /* Ignore unavailable or invalid saved queues. */ }
  document.getElementById("queuePlay").onclick = () => playQueuedEpisode();
  document.getElementById("queueClear").onclick = () => { episodeQueue = []; saveQueue(); };
  document.getElementById("addDetailToQueue").onclick = () => addToQueue(visibleEpisode);
  document.getElementById("player").addEventListener("ended", () => {
    if (episodeQueue.length) playQueuedEpisode();
    else renderQueue();
  });
  ["play", "pause"].forEach(event => document.getElementById("player").addEventListener(event, renderQueue));
  window.addEventListener("podcastedlanguagechange", () => { renderQueue(); updateQueueControls(); });
  renderQueue();
  updateQueueControls();
}
