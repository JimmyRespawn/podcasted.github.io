function renderEpisodes() {
  document.getElementById("clearEpisodeFilter").hidden = !String(document.getElementById("episodeFilter").value || "").length;
  const query = String(document.getElementById("episodeFilter").value || "").trim().toLocaleLowerCase();
  const oldest = document.getElementById("episodeSort").value === "oldest";
  const items = currentEpisodes.filter(episode => episode.title.toLocaleLowerCase().includes(query))
    .map((episode, index) => ({episode, index, date: Date.parse(episode.pubDate)}))
    .sort((a, b) => {
      if (!Number.isFinite(a.date)) return Number.isFinite(b.date) ? 1 : a.index - b.index;
      if (!Number.isFinite(b.date)) return -1;
      return (oldest ? a.date - b.date : b.date - a.date) || a.index - b.index;
    }).map(item => item.episode);
  const list = document.getElementById("episodeList");
  list.replaceChildren();
  document.getElementById("episodeFilterEmpty").hidden = Boolean(items.length);
  list.hidden = !items.length;
  items.forEach(episode => {
    const li = document.createElement("li");
    li.innerHTML = `<div class="episode-copy"><button type="button" class="episode-title episode-details-link">${escapeHTML(episode.title)}</button><div class="episode-meta"><span class="duration">${escapeHTML(episode.duration)}</span><span class="pub-date" data-date="${escapeHTML(episode.pubDate)}">${formatDate(episode.pubDate)}</span></div></div><fluent-button appearance="subtle" class="episode-play" type="button" title="${escapeHTML(t("Play episode"))}" aria-label="${escapeHTML(t("Play episode") + ': ' + episode.title)}">${fluentIcon("play")}</fluent-button>`;
    li.insertBefore(createQueueAddButton(episode), li.querySelector(".episode-play"));
    li.querySelector(".episode-details-link").addEventListener("click", event => {
      event.stopPropagation();
      showEpisodeDetails(episode);
    });
    li.addEventListener("click", () => playEpisode(episode.audioUrl, episode.title, episode));
    list.appendChild(li);
  });
}

function renderEpisodeShownotes(episode) {
  const container = document.getElementById("episodeDetailDescription");
  const text = episode.description || t("No description available for this episode.");
  const fragment = document.createDocumentFragment();
  // Require complete MM:SS or H:MM:SS tokens, with valid minute/second fields.
  const pattern = /(?<![\d:/])(?:\d{1,3}:[0-5]\d:[0-5]\d|\d{1,3}:[0-5]\d)(?![\d:])/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    // A timestamp embedded in a URL is not a chapter marker.
    if (/https?:\/\/\S*$/i.test(text.slice(0, match.index))) continue;
    const seconds = match[0].split(":").reduce((total, part) => total * 60 + Number(part), 0);
    fragment.appendChild(document.createTextNode(text.slice(cursor, match.index)));
    const button = document.createElement("button");
    button.type = "button";
    button.className = "shownote-timestamp";
    button.textContent = match[0];
    button.setAttribute("aria-label", t("Play from {time}", {time: match[0]}));
    button.title = t("Play from {time}", {time: match[0]});
    button.disabled = !episode.audioUrl;
    button.onclick = () => playEpisodeFromTimestamp(episode, seconds);
    fragment.appendChild(button);
    cursor = match.index + match[0].length;
  }
  fragment.appendChild(document.createTextNode(text.slice(cursor)));
  container.replaceChildren(fragment);
}

function playEpisodeFromTimestamp(episode, seconds) {
  if (!episode?.audioUrl || !isValidUrl(episode.audioUrl) || !Number.isFinite(seconds) || seconds < 0) return;
  const player = document.getElementById("player");
  if (player.src !== new URL(episode.audioUrl, location.href).href) {
    playEpisode(episode.audioUrl, episode.title, episode, seconds);
    return;
  }
  sharedEpisodeStart = null;
  if (player.readyState < 1) pendingPlaybackPosition = seconds;
  else {
    pendingPlaybackPosition = null;
    player.currentTime = Number.isFinite(player.duration)
      ? Math.min(seconds, Math.max(0, player.duration - 0.05)) : seconds;
    savePlaybackState();
  }
  player.play().catch(showPlaybackError);
}

let shareTarget = null;
function shareStartSeconds(value) {
  if (!/^\d+(?::[0-5]\d){0,2}$/.test(value.trim())) return null;
  const seconds = value.trim().split(":").reduce((total, part) => total * 60 + Number(part), 0);
  return Number.isSafeInteger(seconds) ? seconds : null;
}

function updateShareUrl() {
  const timeInput = document.getElementById("shareTime");
  const includeTime = Boolean(shareTarget?.audioUrl && document.getElementById("shareIncludeTime").checked);
  const seconds = shareStartSeconds(timeInput.value);
  timeInput.disabled = !includeTime;
  timeInput.setCustomValidity(includeTime && seconds === null ? t("Enter a time such as 12:30.") : "");
  const hosted = ["https:", "http:"].includes(location.protocol);
  document.getElementById("shareLocalNote").hidden = hosted;
  const button = document.getElementById("copyShareButton");
  button.disabled = !hosted || (includeTime && seconds === null);
  if (!hosted || !shareTarget || (includeTime && seconds === null)) {
    document.getElementById("shareUrl").value = "";
    return;
  }
  const url = new URL(location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("podurl", shareTarget.podcast?.feedUrl || shareTarget.feedUrl);
  if (shareTarget.audioUrl) {
    url.searchParams.set("episode", shareTarget.audioUrl);
    if (includeTime) url.searchParams.set("t", String(seconds));
  }
  document.getElementById("shareUrl").value = url.href;
}

function openShareDialog(episode = null) {
  shareTarget = episode || currentPodcastInfo;
  if (!(shareTarget?.podcast?.feedUrl || shareTarget?.feedUrl)) return;
  document.getElementById("shareName").textContent = shareTarget.title;
  document.getElementById("shareTimeOption").hidden = !episode;
  document.getElementById("shareIncludeTime").checked = false;
  const player = document.getElementById("player");
  const position = episode?.audioUrl === playingEpisode?.audioUrl
    ? pendingPlaybackPosition ?? player.currentTime : sharedEpisodeStart?.url === episode?.audioUrl ? sharedEpisodeStart.position : 0;
  document.getElementById("shareTime").value = formatPodcastDuration(String(Math.floor(position || 0)));
  document.getElementById("shareFeedback").textContent = "";
  updateShareUrl();
  document.getElementById("shareDialog").showModal();
}

function initializeEpisodeFeatures() {
  document.getElementById("episodeFilter").addEventListener("input", renderEpisodes);
  document.getElementById("clearEpisodeFilter").addEventListener("click", () => {
    document.getElementById("episodeFilter").value = "";
    renderEpisodes();
    document.getElementById("episodeFilter").focus();
  });
  document.getElementById("episodeSort").addEventListener("change", renderEpisodes);
  ["shareIncludeTime", "shareTime"].forEach(id => document.getElementById(id).addEventListener("input", () => {
    document.getElementById("shareFeedback").textContent = "";
    updateShareUrl();
  }));
  document.getElementById("copyShareButton").addEventListener("click", async () => {
    const input = document.getElementById("shareUrl");
    try {
      await navigator.clipboard.writeText(input.value);
      document.getElementById("shareFeedback").textContent = t("Link copied.");
    } catch {
      input.focus();
      input.select();
      document.getElementById("shareFeedback").textContent = t("Select and copy the link above.");
    }
  });
  window.addEventListener("podcastedlanguagechange", () => {
    if (currentEpisodes.length && !document.getElementById("podcastDetail").hidden) renderEpisodes();
    if (document.getElementById("shareDialog").open) updateShareUrl();
  });
}
