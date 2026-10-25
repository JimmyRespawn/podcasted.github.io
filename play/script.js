let currentPodcastInfo = null;
let currentEpisodes = [];
let sharedEpisodeStart = null;
let playingPodcastInfo = null;
let playingEpisode = null;
let visibleEpisode = null;
const episodeCatalog = new Map();
let pendingPlaybackPosition = null;
const playbackStorageKey = "podcasted.playback.v1";

function readPlaybackState() {
  try {
    const state = JSON.parse(localStorage.getItem(playbackStorageKey));
    if (!state || !/^https?:\/\//i.test(state.url) || !Number.isFinite(state.position) || state.position < 0) return null;
    return state;
  } catch { return null; }
}

function savePlaybackState() {
  const player = document.getElementById("player");
  if (!player.getAttribute("src") || pendingPlaybackPosition !== null) return;
  try {
    localStorage.setItem(playbackStorageKey, JSON.stringify({
      url: player.src,
      title: document.getElementById("currentEpisodeTitle").textContent,
      podcast: playingPodcastInfo,
      episode: playingEpisode,
      position: player.ended ? 0 : player.currentTime || 0,
      rate: player.playbackRate,
      volume: player.volume,
      muted: player.muted,
    }));
  } catch { /* Playback remains available when browser storage is disabled. */ }
}

function restorePlaybackState() {
  const state = readPlaybackState();
  if (!state) return;
  const player = document.getElementById("player");
  playingPodcastInfo = state.podcast;
  playingEpisode = state.episode || { title: state.title || "Saved episode", audioUrl: state.url, podcast: state.podcast };
  pendingPlaybackPosition = state.position;
  player.src = state.url;
  player.playbackRate = [0.75, 1, 1.25, 1.5, 2].includes(state.rate) ? state.rate : 1;
  document.getElementById("playbackRate").value = String(player.playbackRate);
  player.volume = Number.isFinite(state.volume) ? Math.max(0, Math.min(1, state.volume)) : 1;
  player.muted = Boolean(state.muted);
  document.getElementById("currentEpisodeTitle").textContent = state.title || "Saved episode";
  document.getElementById("playPauseButton").disabled = false;
  document.getElementById("elapsedTime").textContent = formatPodcastDuration(String(Math.floor(state.position)));
  updatePlayerInfo();
  showPlayerStatus("Progress restored. Press Play to continue.");
}
function setLoadingState(type, loading) {
  const isFeed = type === "feed";
  const skeleton = document.getElementById(isFeed ? "feedLoading" : "browseLoading");
  const content = document.getElementById(isFeed ? "podcastDetail" : "searchDiv");
  skeleton.hidden = !loading;
  content.setAttribute("aria-busy", String(loading));
  if (loading) {
    skeleton.innerHTML = isFeed
      ? `<div class="skeleton-feed-header"><div class="skeleton-block skeleton-cover"></div><div class="skeleton-copy"><div class="skeleton-block skeleton-heading"></div><div class="skeleton-block skeleton-line"></div><div class="skeleton-block skeleton-line short"></div></div></div>` +
        Array.from({ length: 5 }, () => `<div class="skeleton-episode"><div class="skeleton-block skeleton-line"></div><div class="skeleton-block skeleton-line short"></div></div>`).join("")
      : Array.from({ length: 8 }, () => `<div><div class="skeleton-block skeleton-artwork"></div><div class="skeleton-block skeleton-line"></div><div class="skeleton-block skeleton-line short"></div></div>`).join("");
  }
}

const pageHistory = [];
let pageHistoryIndex = -1;

function recordPage(page) {
  if (JSON.stringify(pageHistory[pageHistoryIndex]) !== JSON.stringify(page)) {
    pageHistory.splice(pageHistoryIndex + 1);
    pageHistory.push(page);
    pageHistoryIndex = pageHistory.length - 1;
  }
  updateHistoryButtons();
}

function updateHistoryButtons() {
  document.getElementById("backButton").disabled = pageHistoryIndex <= 0;
  document.getElementById("forwardButton").disabled = pageHistoryIndex >= pageHistory.length - 1;
}

function navigatePage(direction) {
  const nextIndex = pageHistoryIndex + direction;
  if (nextIndex < 0 || nextIndex >= pageHistory.length) return;
  pageHistoryIndex = nextIndex;
  const page = pageHistory[pageHistoryIndex];
  document.getElementById("searchInput").value = page.type === "discover" ? "" : page.query;
  updateSearchClearButton();
  if (page.type === "discover") showDiscover(false);
  else if (page.type === "queue") showQueue(false);
  else if (page.type === "settings") showSettings(false);
  else if (page.type === "episode") showEpisodeDetails(page.episode, false);
  else if (page.type === "feed") loadPodcastList(page.query, false);
  else searchPodcasts(page.query, false, false);
  updateHistoryButtons();
}

document.addEventListener("DOMContentLoaded", async function () {
  await Promise.all(["fluent-button", "fluent-text-input", "fluent-dropdown", "fluent-listbox", "fluent-option", "fluent-slider"].map(tag => customElements.whenDefined(tag)));
  // Wait for v3 dropdown option slots before restoring saved control values.
  await new Promise(resolve => requestAnimationFrame(resolve));
  document.getElementById("searchInput").addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.isComposing) handleSearchSubmit(event);
  });
  document.querySelector(".unified-search").addEventListener("click", event => {
    if (!event.target.closest("fluent-button")) document.getElementById("searchInput").focus();
  });
  const languagePicker = document.getElementById("languagePicker");
  languagePicker.value = window.PodcastedI18n.preference;
  languagePicker.addEventListener("change", () => window.PodcastedI18n.setPreference(languagePicker.value));
  window.addEventListener("podcastedlanguagechange", () => {
    languagePicker.value = window.PodcastedI18n.preference;
    const message = document.getElementById("playerStatusText");
    if (message.dataset.message) message.textContent = t(message.dataset.message);
    updateEpisodeDetailPlayButton();
    document.querySelectorAll('.pub-date[data-date]').forEach(node => { node.textContent = formatDate(node.dataset.date); });
    const expanded = document.getElementById("audioPlayerPanel").classList.contains("is-expanded");
    document.getElementById("expandPlayerButton").setAttribute("aria-label", t(expanded ? "Close full-screen player" : "Open full-screen player"));
    const page = pageHistory[pageHistoryIndex];
    if (page?.type === "search") document.getElementById("browseTitle").textContent = t("Results for “{query}”", {query: page.query});
    if (visibleEpisode) {
      document.getElementById("episodeDetailMeta").textContent = [formatDate(visibleEpisode.pubDate), visibleEpisode.duration].filter(Boolean).join(" · ");
      renderEpisodeShownotes(visibleEpisode);
    }
  });
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", updateSearchClearButton);
  searchInput.addEventListener("change", updateSearchClearButton);
  document.getElementById("clearSearchButton").addEventListener("click", () => {
    searchInput.value = "";
    updateSearchClearButton();
    searchInput.focus();
  });
  updateSearchClearButton();
  initializePlayer();
  const themePicker = document.getElementById("themePicker");
  themePicker.value = window.PodcastedTheme.preference;
  themePicker.addEventListener("change", () => {
    if (themePicker.value !== window.PodcastedTheme.preference) window.PodcastedTheme.setPreference(themePicker.value);
  });
  window.addEventListener("podcastedthemechange", () => { themePicker.value = window.PodcastedTheme.preference; });
  initializeQueue();
  const urlParams = new URLSearchParams(window.location.search);
  initializeSubscriptions();
  const podUrl = urlParams.get("podurl");
  const playUrl = urlParams.get("play");

  if (podUrl) {
    document.getElementById("searchInput").value = podUrl;
  updateSearchClearButton();
    await loadPodcastList(podUrl);
  } else showDiscover();

  const sharedAudio = urlParams.get("episode");
  const requestedTime = Number(urlParams.get("t"));
  const startPosition = Number.isFinite(requestedTime) && requestedTime >= 0 ? requestedTime : 0;
  if (sharedAudio) {
    const episode = currentEpisodes.find(item => item.audioUrl === sharedAudio);
    if (episode) {
      sharedEpisodeStart = { url: sharedAudio, position: startPosition };
      showEpisodeDetails(episode);
    } else showPlayerStatus("This shared episode could not be found in the feed.", "error");
  } else if (playUrl) {
    playEpisode(playUrl, undefined, undefined, urlParams.has("t") ? startPosition : null);
  } else restorePlaybackState();
  initializePlayerTools();
  initializePlayerMoreMenu();
  initializeEpisodeFeatures();
});

// 前端 JavaScript 更新
// 更新后的加载函数
let feedRequestId = 0;

function parsePodcastAuthor(channel) {
  // Match XML names directly: CSS selectors can miss namespaced RSS fields.
  // Only inspect channel metadata, so an episode's author is never used here.
  const fields = Array.from(channel.children);
  const text = element => element?.textContent?.trim() || "";
  const itunesField = name => fields.find(element => element.localName === name &&
    (/itunes\.com\/dtds\/podcast/i.test(element.namespaceURI || "") || element.prefix === "itunes"));
  const owner = itunesField("owner");
  return text(itunesField("author")) ||
    text(fields.find(element => element.localName === "creator")) ||
    text(fields.find(element => element.localName === "author")) ||
    text(owner && Array.from(owner.children).find(element => element.localName === "name")) ||
    text(fields.find(element => element.localName === "managingEditor")) ||
    "Unknown Author";
}

function parsePodcastCover(channel, feedUrl) {
  const fields = Array.from(channel.children);
  const candidates = fields.filter(node => node.localName === "image").map(node =>
    node.getAttribute("href") || Array.from(node.children).find(child => child.localName === "url")?.textContent);
  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    try {
      const url = new URL(candidate.trim(), feedUrl);
      if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password) return url.href;
    } catch { /* Try the next channel artwork field. */ }
  }
  return "";
}

async function loadPodcastList(podUrl = document.getElementById("searchInput").value.trim(), addHistory = true) {
  if (!podUrl) {
    alert("Please Enter Valid RSS URL");
    return;
  }
  setNavigationView("listen");

  if (addHistory) recordPage({ type: "feed", query: podUrl });
  const episodeList = document.getElementById("episodeList");
  const requestId = ++feedRequestId;
  ++searchRequestId;
  document.getElementById("searchDiv").hidden = true;
  document.getElementById("podcastDetail").hidden = false;
  document.getElementById("podcastInfo").style.display = "none";
  const feedStatus = document.getElementById("feedStatus");
  feedStatus.hidden = true;
  feedStatus.textContent = "";
  currentEpisodes = [];
  document.getElementById("episodeFilterEmpty").hidden = true;
  document.getElementById("episodeList").hidden = false;
  document.getElementById("episodeTools").hidden = true;
  document.getElementById("feedDownload").hidden = true;
  setLoadingState("feed", true);
  episodeList.innerHTML = "";


  try {
    const response = await fetch(podUrl);
    if (!response.ok) throw new Error("RSS request failed");
    const xmlText = await response.text();
    if (requestId !== feedRequestId) return;
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");

    const channel = xml.querySelector("channel");
    if (!channel) throw new Error("Invalid podcast RSS feed");
    const title = channel.querySelector("title")?.textContent || "Untitled";
    const author = parsePodcastAuthor(channel);
    const image = parsePodcastCover(channel, response.url || podUrl);
    const description = channel.querySelector("description")?.textContent || "No description";

   const items = Array.from(channel.getElementsByTagName("item")).map(item => {
  const getText = (tag) => item.getElementsByTagName(tag)[0]?.textContent?.trim() || "";
  const getAttr = (tag, attr) => item.getElementsByTagName(tag)[0]?.getAttribute(attr) || "";

  return {
    title: getText("title") || "No Title",
    audioUrl: getAttr("enclosure", "url"),
    pubDate: getText("pubDate"),
    duration: formatPodcastDuration(getText("itunes:duration") || "0"),
    description: plainEpisodeDescription(getText("content:encoded") || getText("description") || getText("itunes:summary")),
    link: getText("link")
  };
});


    episodeList.innerHTML = "";

    // 播客信息展示
    const podcastInfo = document.getElementById("podcastInfo");
    podcastInfo.style.display = "flex";
    const podcastCover = document.getElementById("podcastCover");
    podcastCover.hidden = !image;
    if (image) podcastCover.src = image;
    else podcastCover.removeAttribute("src");
    document.getElementById("podcastTitle").textContent = title;
    document.getElementById("podcastAuthor").textContent = `by ${author}`;
    const descriptionDocument = new DOMParser().parseFromString(description, "text/html");
    document.getElementById("podcastDesc").textContent = descriptionDocument.body.textContent;


    currentPodcastInfo = { author, title, cover: image, feedUrl: podUrl };
    items.forEach(episode => {
      episode.podcast = currentPodcastInfo;
      episodeCatalog.set(episode.audioUrl, episode);
    });
    if (playingEpisode && episodeCatalog.has(playingEpisode.audioUrl)) {
      playingEpisode = episodeCatalog.get(playingEpisode.audioUrl);
      playingPodcastInfo = playingEpisode.podcast;
      updatePlayerInfo();
    }

    currentEpisodes = items;
    document.getElementById("episodeFilter").value = "";
    document.getElementById("episodeSort").value = "newest";
    document.getElementById("episodeTools").hidden = false;
    renderEpisodes();
    feedStatus.hidden = true;

  } catch (error) {
    if (requestId !== feedRequestId) return;
    console.error("Error:", error);
    episodeList.innerHTML = "";
    const status = document.getElementById("feedStatus");
    status.textContent = t("Unable to load this RSS feed. Check the URL and whether the feed allows browser access (CORS).");
    status.hidden = false;
    document.getElementById("feedDownload").hidden = false;
  } finally {
    if (requestId === feedRequestId) {
      setLoadingState("feed", false);
    }
  }
}

function formatPodcastDuration(duration) {
  if (!duration) return "00:00";

  // Remove whitespace and trim
  duration = duration.trim();

  // If it's already in HH:MM:SS or MM:SS format
  if (/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(duration)) {
    const parts = duration.split(":").map(Number);
    while (parts.length < 3) parts.unshift(0); // Ensure HH:MM:SS
    const [h, m, s] = parts;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  // If it's a number (assume seconds)
  const seconds = parseInt(duration, 10);
  if (!isNaN(seconds)) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  return "00:00"; // fallback
}

function pad(num) {
  return num.toString().padStart(2, "0");
}


// 新增HTML转义函数
const escapeHTML = (str) => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

// 图片加载失败处理
document.getElementById("podcastCover").onerror = function () {
  this.hidden = true;
};

// 更新播放函数
function playEpisode(url, title, episode = episodeCatalog.get(url), startPosition = null) {
  const player = document.getElementById("player");
  const currentEpisodeTitle = document.getElementById("currentEpisodeTitle");

  try {
    // 安全验证URL
    if (!isValidUrl(url)) {
      throw new Error("Invalid audio URL");
    }

    savePlaybackState();
    const saved = readPlaybackState();
    playingEpisode = episode || { title: title || "Episode", audioUrl: url, podcast: currentPodcastInfo };
    playingPodcastInfo = playingEpisode.podcast || currentPodcastInfo;
    pendingPlaybackPosition = Number.isFinite(startPosition) ? startPosition
      : sharedEpisodeStart?.url === url ? sharedEpisodeStart.position
      : saved?.url === url ? saved.position : 0;
    sharedEpisodeStart = null;
    player.src = url;
    player.play().catch(showPlaybackError);
    document.getElementById("playPauseButton").disabled = false;
    document.getElementById("playerStatus").hidden = true;
    currentEpisodeTitle.textContent = title || "Playing...";
    updatePlayerInfo();

  } catch (error) {
    console.error("Playback error:", error);
    alert("Error playing episode");
  }
}

// URL验证函数
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/* 快进 30 秒 */
function seekForward() {
  const player = document.getElementById("player");
  if (Number.isFinite(player.duration)) {
    player.currentTime = Math.min(player.duration, player.currentTime + 30);
  }
}

/* 快退 15 秒 */
function seekBackward() {
  const player = document.getElementById("player");
  if (player.currentSrc) player.currentTime = Math.max(0, player.currentTime - 15);
}

function updatePlayerInfo() {
  window.dispatchEvent(new Event("podcastedplayerchange"));
  syncQueueCurrentEpisode();
  syncMediaMetadata();
  const cover = document.getElementById("playerCover");
  cover.hidden = !playingPodcastInfo?.cover;
  if (playingPodcastInfo?.cover) cover.src = playingPodcastInfo.cover;
  document.getElementById("playerSubtitle").textContent = playingPodcastInfo
    ? `${playingPodcastInfo.title} · ${playingPodcastInfo.author}` : "Podcasted";
  ["currentEpisodeTitle", "playerSubtitle"].forEach(id => {
    const canOpen = id === "currentEpisodeTitle" ? Boolean(playingEpisode?.audioUrl) : Boolean(playingPodcastInfo?.feedUrl);
    const link = document.getElementById(id);
    link.setAttribute("aria-disabled", String(!canOpen));
    link.tabIndex = canOpen ? 0 : -1;
    link.title = canOpen ? (id === "currentEpisodeTitle" ? t("Open episode details") : t("Open podcast episodes")) : "";
  });
}

function syncMediaMetadata(useAppIcon = false) {
  if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
  const player = document.getElementById("player");
  if (!player.getAttribute("src")) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: playingEpisode?.title || document.getElementById("currentEpisodeTitle").textContent || "Podcasted",
      artist: playingPodcastInfo?.title || playingPodcastInfo?.author || "Podcasted",
      album: playingPodcastInfo?.author || "",
      artwork: generateArtworkArray(useAppIcon ? null : playingPodcastInfo?.cover),
    });
    navigator.mediaSession.playbackState = player.paused || player.ended ? "paused" : "playing";
  } catch (error) { console.debug("Media metadata unavailable:", error); }
}

function syncMediaPosition() {
  if (!("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) return;
  const player = document.getElementById("player");
  try {
    if (!Number.isFinite(player.duration) || player.duration <= 0) navigator.mediaSession.setPositionState();
    else navigator.mediaSession.setPositionState({
      duration: player.duration,
      position: Math.max(0, Math.min(player.duration, player.currentTime || 0)),
      playbackRate: player.playbackRate,
    });
  } catch { /* Position reporting is optional on older browsers. */ }
}

function initializeMediaSession() {
  if (!("mediaSession" in navigator)) return;
  const player = document.getElementById("player");
  const seek = position => {
    if (Number.isFinite(player.duration)) player.currentTime = Math.max(0, Math.min(player.duration, position));
  };
  const actions = {
    play: () => { if (player.getAttribute("src")) player.play().catch(showPlaybackError); },
    pause: () => player.pause(),
    seekbackward: details => seek(player.currentTime - (details.seekOffset || 15)),
    seekforward: details => seek(player.currentTime + (details.seekOffset || 30)),
    seekto: details => { if (Number.isFinite(details.seekTime)) seek(details.seekTime); },
  };
  Object.entries(actions).forEach(([action, handler]) => {
    try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* Unsupported action. */ }
  });
}

function openPlayingPodcast(event) {
  event.preventDefault();
  if (!playingPodcastInfo?.feedUrl) return;
  setExpandedPlayer(false);
  loadPodcastList(playingPodcastInfo.feedUrl);
  document.getElementById("contentScroll").scrollTo({ top: 0, behavior: "smooth" });
}

function plainEpisodeDescription(html) {
  const text = String(html || "").replace(/<br\s*\/?\s*>/gi, "\n").replace(/<\/(p|div|li|h[1-6])>/gi, "\n\n");
  const parsed = new DOMParser().parseFromString(text, "text/html");
  parsed.querySelectorAll("script, style").forEach(element => element.remove());
  return parsed.body.textContent.replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function openPlayingEpisode(event) {
  event.preventDefault();
  if (playingEpisode?.audioUrl) showEpisodeDetails(playingEpisode);
}

function showEpisodeDetails(episode, addHistory = true) {
  if (!episode) return;
  setExpandedPlayer(false);
  if (addHistory) recordPage({ type: "episode", query: "", episode });
  ++feedRequestId;
  ++searchRequestId;
  setNavigationView("listen");
  document.getElementById("searchDiv").hidden = true;
  document.getElementById("podcastDetail").hidden = true;
  document.getElementById("episodeDetail").hidden = false;
  visibleEpisode = episode;
  updateQueueControls();
  document.getElementById("episodeDetailTitle").textContent = episode.title || "Episode";
  const channel = document.getElementById("episodeDetailChannel");
  channel.textContent = episode.podcast?.title || "Podcast";
  channel.hidden = !episode.podcast?.feedUrl;
  document.getElementById("episodeDetailMeta").textContent = [formatDate(episode.pubDate), episode.duration].filter(Boolean).join(" · ");
  renderEpisodeShownotes(episode);
  const artwork = document.getElementById("episodeDetailArtwork");
  artwork.innerHTML = fluentIcon("music");
  if (episode.podcast?.cover) {
    const image = document.createElement("img");
    image.className = "cover";
    image.alt = "";
    image.src = episode.podcast.cover;
    image.onerror = () => image.remove();
    artwork.appendChild(image);
  }
  const source = document.getElementById("episodeDetailSource");
  source.hidden = true;
  try {
    const url = new URL(episode.link);
    if (["http:", "https:"].includes(url.protocol)) { source.href = url.href; source.hidden = false; }
  } catch { /* Some feeds do not include an episode website. */ }
  updateEpisodeDetailPlayButton();
  document.getElementById("contentScroll").scrollTo({ top: 0 });
}

function updateEpisodeDetailPlayButton() {
  if (!visibleEpisode) return;
  const player = document.getElementById("player");
  const current = player.getAttribute("src") === visibleEpisode.audioUrl;
  const button = document.getElementById("episodeDetailPlay");
  button.disabled = !visibleEpisode.audioUrl;
  button.textContent = current ? (player.paused || player.ended ? t("Resume") : t("Pause")) : t("Play episode");
}

function playDetailEpisode() {
  if (!visibleEpisode?.audioUrl) return;
  const player = document.getElementById("player");
  if (player.getAttribute("src") === visibleEpisode.audioUrl) togglePlayback();
  else playEpisode(visibleEpisode.audioUrl, visibleEpisode.title, visibleEpisode);
}

function openEpisodeChannel(event) {
  event.preventDefault();
  if (visibleEpisode?.podcast?.feedUrl) loadPodcastList(visibleEpisode.podcast.feedUrl);
}

function showPlayerStatus(message, intent = "info") {
  const status = document.getElementById("playerStatus");
  status.setAttribute("intent", intent);
  status.setAttribute("role", intent === "error" ? "alert" : "status");
  document.getElementById("playerStatusText").dataset.message = message;
  document.getElementById("playerStatusText").textContent = t(message);
  status.hidden = false;
}

function showPlaybackError(error) {
  console.error("Playback error:", error);
  const blocked = error?.name === "NotAllowedError";
  showPlayerStatus(blocked ? "Press Play to start listening."
    : "Unable to play this episode. Please try again.", blocked ? "info" : "error");
}

function togglePlayback() {
  const player = document.getElementById("player");
  if (!player.currentSrc && !player.getAttribute("src")) return;
  if (player.paused) player.play().catch(showPlaybackError);
  else player.pause();
}

let playerReturnFocus = null;
let playerTransition = null;
function setExpandedPlayer(expanded) {
  const panel = document.getElementById("audioPlayerPanel");
  if (panel.classList.contains("is-expanded") === expanded) return;
  const previousBounds = panel.getBoundingClientRect();
  playerTransition?.cancel();
  if (expanded) playerReturnFocus = document.activeElement;
  panel.classList.toggle("is-expanded", expanded);
  document.body.classList.toggle("player-expanded", expanded);
  document.querySelector(".app-main").inert = expanded;
  document.querySelector(".sidebar").inert = expanded;
  document.getElementById("expandPlayerButton").setAttribute("aria-expanded", String(expanded));
  document.getElementById("expandPlayerButton").setAttribute("aria-label", expanded ? t("Close full-screen player") : t("Open full-screen player"));
  if (expanded) {
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    document.getElementById("closeExpandedPlayer").focus();
  } else {
    panel.removeAttribute("role");
    panel.removeAttribute("aria-modal");
    if (document.getElementById("playbackRate").open) document.getElementById("playbackRate").open = false;
    playerReturnFocus?.focus();
  }
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const bounds = panel.getBoundingClientRect();
    // Animate the existing player between its two layouts without replacing audio.
    const transition = panel.animate([
      {
        transform: `translate(${previousBounds.left - bounds.left}px, ${previousBounds.top - bounds.top}px) scale(${previousBounds.width / bounds.width}, ${previousBounds.height / bounds.height})`,
        transformOrigin: "top left",
      },
      { transform: "none", transformOrigin: "top left" },
    ], { duration: 300, easing: "cubic-bezier(0.2, 0, 0, 1)" });
    playerTransition = transition;
    transition.onfinish = () => {
      if (playerTransition === transition) playerTransition = null;
    };
  }
}

function initializePlayer() {
  const player = document.getElementById("player");
  initializeMediaSession();
  document.getElementById("closeExpandedPlayer").innerHTML = fluentIcon("back");
  document.addEventListener("keydown", event => {
    const panel = document.getElementById("audioPlayerPanel");
    if (!panel.classList.contains("is-expanded")) return;
    if (event.key === "Escape" && !event.defaultPrevented && !document.getElementById("playbackRate").open) {
      event.preventDefault();
      setExpandedPlayer(false);
    }
    if (event.key !== "Tab") return;
    const controls = Array.from(panel.querySelectorAll('button:not([slot]), a[href]:not([tabindex="-1"]), fluent-button:not([disabled]), fluent-slider:not([disabled]), fluent-dropdown'))
      .filter(element => element.getClientRects().length && !element.closest("[hidden]"));
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  let syncingControls = false;
  player.addEventListener("loadedmetadata", () => {
    if (pendingPlaybackPosition === null) return;
    const position = pendingPlaybackPosition;
    pendingPlaybackPosition = null;
    player.currentTime = Number.isFinite(player.duration) && position >= player.duration ? 0 : position;
    savePlaybackState();
  });
  let lastSave = 0;
  player.addEventListener("timeupdate", () => {
    if (Date.now() - lastSave >= 3000) { savePlaybackState(); lastSave = Date.now(); }
  });
  ["pause", "seeked", "ended", "ratechange", "volumechange"].forEach(event => player.addEventListener(event, savePlaybackState));
  window.addEventListener("pagehide", savePlaybackState);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") savePlaybackState();
  });
  const progress = document.getElementById("playbackProgress");
  const playButton = document.getElementById("playPauseButton");
  const updateProgress = () => {
    syncMediaPosition();
    const duration = Number.isFinite(player.duration) ? player.duration : 0;
    progress.disabled = duration <= 0;
    syncingControls = true;
    progress.value = String(duration ? player.currentTime / duration * 100 : 0);
    syncingControls = false;
    document.getElementById("elapsedTime").textContent = formatPodcastDuration(String(Math.floor(player.currentTime || 0)));
    document.getElementById("remainingTime").textContent = "-" + formatPodcastDuration(String(Math.floor(Math.max(0, duration - player.currentTime)) || 0));
    progress.setAttribute("aria-valuetext", `${document.getElementById("elapsedTime").textContent} elapsed`);
  };
  const updatePlayback = () => {
    updateEpisodeDetailPlayButton();
    const playing = !player.paused && !player.ended;
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = player.getAttribute("src") ? (playing ? "playing" : "paused") : "none";
    }
    if (playing) syncMediaMetadata();
    playButton.setAttribute("aria-label", playing ? t("Pause") : t("Play"));
    playButton.title = playing ? t("Pause") : t("Play");
    playButton.innerHTML = fluentIcon(playing ? "pause" : "play");
    if (playing) document.getElementById("playerStatus").hidden = true;
  };
  ["timeupdate", "loadedmetadata", "durationchange", "emptied"].forEach(event => player.addEventListener(event, updateProgress));
  ["play", "pause", "ended"].forEach(event => player.addEventListener(event, updatePlayback));
  player.addEventListener("ratechange", syncMediaPosition);
  player.addEventListener("error", showPlaybackError);
  progress.addEventListener("change", () => {
    if (syncingControls) return;
    if (Number.isFinite(player.duration)) player.currentTime = Number(progress.value) / 100 * player.duration;
    updateProgress();
  });
  document.getElementById("playbackRate").addEventListener("change", event => {
    player.playbackRate = Number(event.target.value);
  });
  const volume = document.getElementById("volumeControl");
  const muteButton = document.getElementById("muteButton");
  volume.addEventListener("change", () => {
    if (syncingControls) return;
    player.volume = Number(volume.value);
    player.muted = player.volume === 0;
  });
  muteButton.addEventListener("click", () => {
    if (player.volume === 0) { player.volume = 1; player.muted = false; }
    else player.muted = !player.muted;
  });
  player.addEventListener("volumechange", () => {
    const muted = player.muted || player.volume === 0;
    syncingControls = true;
    volume.value = String(player.muted ? 0 : player.volume);
    syncingControls = false;
    muteButton.setAttribute("aria-label", muted ? t("Unmute") : t("Mute"));
    muteButton.title = muted ? t("Unmute") : t("Mute");
    const volumeIcon = muted ? "muted" : player.volume <= 0.33 ? "volumeLow"
      : player.volume <= 0.66 ? "volumeMedium" : "volume";
    muteButton.innerHTML = fluentIcon(volumeIcon);
  });
  document.getElementById("playerCover").addEventListener("error", event => { event.target.hidden = true; syncMediaMetadata(true); });
  updateProgress();
  updatePlayback();
}

// 添加日期格式化辅助函数
function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString(window.PodcastedI18n.locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

//System media player support

// 生成符合标准的封面数组
function generateArtworkArray(coverUrl) {
  if (coverUrl) {
    try {
      const url = new URL(coverUrl, window.location.href);
      if (["http:", "https:", "file:"].includes(url.protocol)) return [{ src: url.href }];
    } catch { /* Fall back to the local app artwork. */ }
  }
  return [{ src: new URL("icons/app-512.png", window.location.href).href, sizes: "512x512", type: "image/png" }];
}

let searchRequestId = 0;

// Apple's JSONP endpoint supports cross-origin searches, including local pages.
function requestPodcastSearch(query, requestId, comedyOnly = false) {
  return new Promise((resolve, reject) => {
    const callbackName = `podcastSearch_${Date.now()}_${requestId}`;
    const script = document.createElement("script");
    const url = new URL("https://itunes.apple.com/search");
    url.search = new URLSearchParams({
      media: "podcast",
      entity: "podcast",
      limit: comedyOnly ? "40" : "24",
      term: query,
      callback: callbackName,
    }).toString();
    if (comedyOnly) url.searchParams.set("genreId", "1303");

    const cleanup = () => {
      clearTimeout(timeout);
      script.remove();
      delete window[callbackName];
    };
    const fail = (message) => {
      cleanup();
      reject(new Error(message));
    };
    const timeout = setTimeout(() => fail("Search request timed out"), 15000);

    window[callbackName] = (data) => {
      cleanup();
      if (!data || !Array.isArray(data.results)) {
        reject(new Error("Invalid search response"));
        return;
      }
      resolve(data);
    };
    script.onerror = () => fail("Could not connect to podcast search");
    script.onload = () => {
      if (window[callbackName]) fail("Search response did not include a callback");
    };
    script.src = url.toString();
    document.head.appendChild(script);
  });
}

async function searchPodcasts(query = document.getElementById("searchInput").value.trim(), comedyOnly = false, addHistory = true) {
  if (!query) return;
  setNavigationView("listen");
  if (addHistory) recordPage({ type: comedyOnly ? "discover" : "search", query });
  const requestId = ++searchRequestId;
  ++feedRequestId;
  document.getElementById("searchDiv").hidden = false;
  document.getElementById("podcastDetail").hidden = true;
  document.getElementById("browseTitle").textContent = comedyOnly ? "Comedy" : t("Results for “{query}”", {query});
  document.getElementById("browseEyebrow").textContent = comedyOnly ? t("Dedicated to creators") : t("SEARCH PODCASTS");
  document.getElementById("retryBrowse").hidden = true;

  document.getElementById("searchEmptyState").hidden = true;
  const status = document.getElementById("searchStatus");
  const results = document.getElementById("searchResults");
  status.hidden = true;
  status.textContent = "";
  setLoadingState("browse", true);
  results.hidden = true;

  try {
    const data = await requestPodcastSearch(query, requestId, comedyOnly);
    if (!status.isConnected || requestId !== searchRequestId) return;
    const podcasts = data.results.filter(podcast => podcast.feedUrl && (!comedyOnly || podcast.genreIds?.includes("1303") || podcast.primaryGenreName === "Comedy"));
    displaySearchResults(podcasts);
    status.textContent = podcasts.length ? "" : t("No podcasts found. Try another name or topic.");
    status.hidden = podcasts.length > 0;
    results.hidden = podcasts.length === 0;
  } catch (error) {
    if (!status.isConnected || requestId !== searchRequestId) return;
    console.error("Search failed:", error);
    status.textContent = t("Search failed. Please try again.");
    status.hidden = false;
    document.getElementById("retryBrowse").hidden = !comedyOnly;
  } finally {
    if (requestId === searchRequestId) {
      setLoadingState("browse", false);
      status.classList.remove("is-loading");
    }
  }
}

function displaySearchResults(podcasts) {
  const resultsContainer = document.getElementById("searchResults");
  resultsContainer.innerHTML = "";

  podcasts.forEach((podcast) => {
    const li = document.createElement("li");
    const button = document.createElement("fluent-button");
    button.className = "podcast-card";
    button.setAttribute("role", "button");
    button.setAttribute("appearance", "subtle");
    const artwork = document.createElement("div");
    artwork.className = "card-artwork";
    artwork.innerHTML = fluentIcon("music");
    const image = document.createElement("img");
    image.src = podcast.artworkUrl600 || podcast.artworkUrl100;
    image.alt = "";
    image.loading = "lazy";
    image.onerror = () => image.remove();
    artwork.appendChild(image);
    const title = document.createElement("span");
    title.className = "card-title";
    title.textContent = podcast.collectionName || podcast.trackName;
    const author = document.createElement("span");
    author.className = "card-author";
    author.textContent = podcast.artistName || "";
    button.append(artwork, title, author);
    button.onclick = () => selectPodcast(podcast.feedUrl);
    li.appendChild(button);
    resultsContainer.appendChild(li);
  });
}

function selectPodcast(feedUrl) {
  loadPodcastList(feedUrl);
}

function showDiscover(addHistory = true) {
  setNavigationView("listen");
  if (addHistory) recordPage({ type: "discover", query: "" });
  ++searchRequestId;
  ++feedRequestId;
  document.getElementById("searchInput").value = "";
  updateSearchClearButton();
  document.getElementById("searchDiv").hidden = false;
  document.getElementById("podcastDetail").hidden = true;
  document.getElementById("browseTitle").textContent = t("Listen");
  document.getElementById("browseEyebrow").textContent = t("Dedicated to creators");
  document.getElementById("searchEmptyState").hidden = false;
  document.getElementById("searchStatus").hidden = true;
  document.getElementById("searchStatus").classList.remove("is-loading");
  document.getElementById("searchResults").hidden = true;
  document.getElementById("searchResults").innerHTML = "";
  document.getElementById("retryBrowse").hidden = true;
  setLoadingState("browse", false);
  setLoadingState("feed", false);
  renderLinkedSubscriptions();
}

function setNavigationView(view) {
  hideLinkedSubscriptions();
  document.getElementById("episodeDetail").hidden = true;
  document.getElementById("settingsPage").hidden = view !== "settings";
  document.getElementById("queuePage").hidden = view !== "queue";
  [["discoverNav", "listen"], ["queueNav", "queue"], ["settingsNav", "settings"]].forEach(([id, name]) => {
    const item = document.getElementById(id);
    item.classList.toggle("active", view === name);
    if (view === name) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
}

function showSettings(addHistory = true) {
  if (addHistory) recordPage({ type: "settings", query: "" });
  ++feedRequestId;
  ++searchRequestId;
  setNavigationView("settings");
  document.getElementById("searchDiv").hidden = true;
  document.getElementById("podcastDetail").hidden = true;
  document.getElementById("searchInput").value = "";
  updateSearchClearButton();
  document.getElementById("themePicker").value = window.PodcastedTheme.preference;
  document.getElementById("contentScroll").scrollTo({ top: 0 });
}

// Native form submission supports both Enter and the Search button.
function handleSearchSubmit(event) {
  event.preventDefault();
  const searchInput = document.getElementById("searchInput");
  const query = searchInput.value.trim();
  // The editable input lives inside the Fluent component's shadow root.
  searchInput.shadowRoot?.activeElement?.blur();
  searchInput.blur();
  if (!query) { showDiscover(); return; }
  if (/^https?:\/\//i.test(query)) loadPodcastList(query);
  else searchPodcasts(query);
}

function handleRSSURLEnter(event) {
  if (event.key === "Enter") {
    loadPodcastList();
  }
}

function updateSearchClearButton() {
  document.getElementById("clearSearchButton").hidden = !String(document.getElementById("searchInput").value || "").length;
}
