let currentPodcastInfo = null;
let playingPodcastInfo = null;
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
  const status = document.getElementById("playerStatus");
  status.textContent = "Progress restored. Press Play to continue.";
  status.hidden = false;
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
  if (page.type === "discover") showDiscover(false);
  else if (page.type === "feed") loadPodcastList(page.query, false);
  else searchPodcasts(page.query, false, false);
  updateHistoryButtons();
}

document.addEventListener("DOMContentLoaded", async function () {
  await Promise.all(["fluent-button", "fluent-text-field", "fluent-select", "fluent-slider"].map(tag => customElements.whenDefined(tag)));
  document.getElementById("searchInput").addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.isComposing) handleSearchSubmit(event);
  });
  document.querySelector(".unified-search").addEventListener("click", event => {
    if (!event.target.closest("fluent-button")) document.getElementById("searchInput").focus();
  });
  initializePlayer();
  const urlParams = new URLSearchParams(window.location.search);
  const podUrl = urlParams.get("podurl");
  const playUrl = urlParams.get("play");

  if (podUrl) {
    document.getElementById("searchInput").value = podUrl;
    loadPodcastList(podUrl);
  } else showDiscover();

  if (playUrl) {
    playEpisode(playUrl);
  } else restorePlaybackState();
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

async function loadPodcastList(podUrl = document.getElementById("searchInput").value.trim(), addHistory = true) {
  if (!podUrl) {
    alert("Please Enter Valid RSS URL");
    return;
  }

  if (addHistory) recordPage({ type: "feed", query: podUrl });
  const episodeList = document.getElementById("episodeList");
  const requestId = ++feedRequestId;
  ++searchRequestId;
  document.getElementById("searchDiv").hidden = true;
  document.getElementById("podcastDetail").hidden = false;
  document.getElementById("podcastInfo").style.display = "none";
  const feedStatus = document.getElementById("feedStatus");
  feedStatus.hidden = false;
  feedStatus.classList.add("is-loading");
  feedStatus.textContent = "Loading episodes…";
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
    const image = channel.querySelector("itunes\\:image")?.getAttribute("href") ||
                  channel.querySelector("image > url")?.textContent ||
                  "";
    const description = channel.querySelector("description")?.textContent || "No description";

   const items = Array.from(channel.getElementsByTagName("item")).map(item => {
  const getText = (tag) => item.getElementsByTagName(tag)[0]?.textContent?.trim() || "";
  const getAttr = (tag, attr) => item.getElementsByTagName(tag)[0]?.getAttribute(attr) || "";

  return {
    title: getText("title") || "No Title",
    audioUrl: getAttr("enclosure", "url"),
    pubDate: getText("pubDate"),
    duration: formatPodcastDuration(getText("itunes:duration") || "0")
  };
});


    episodeList.innerHTML = "";

    // 播客信息展示
    const podcastInfo = document.getElementById("podcastInfo");
    podcastInfo.style.display = "flex";
    const podcastCover = document.getElementById("podcastCover");
    podcastCover.hidden = !image;
    if (image) podcastCover.src = encodeURI(image);
    else podcastCover.removeAttribute("src");
    document.getElementById("podcastTitle").textContent = title;
    document.getElementById("podcastAuthor").textContent = `by ${author}`;
    const descriptionDocument = new DOMParser().parseFromString(description, "text/html");
    document.getElementById("podcastDesc").textContent = descriptionDocument.body.textContent;


    currentPodcastInfo = { author, title, cover: encodeURI(image), feedUrl: podUrl };

    const list = document.getElementById("episodeList");
    list.innerHTML = items.map((ep) => {
      const safeTitle = escapeHTML(ep.title);
      const safeUrl = encodeURIComponent(ep.audioUrl);
      return `
        <li data-url="${safeUrl}" data-title="${safeTitle}">
          <div class="episode-copy">
            <span class="episode-title">${safeTitle}</span>
            <div class="episode-meta">
              <span class="duration">${ep.duration}</span>
              <span class="pub-date">${formatDate(ep.pubDate)}</span>
            </div>
          </div>
          <fluent-button appearance="stealth" type="button" class="episode-play" aria-label="Play ${safeTitle}" title="Play episode">
            ${fluentIcon("play")}
          </fluent-button>
        </li>`;
    }).join("");

    list.querySelectorAll("li").forEach((li) => {
      li.addEventListener("click", () => {
        const url = decodeURIComponent(li.dataset.url);
        const title = li.dataset.title;
        playEpisode(url, title);
      });
    });
    feedStatus.hidden = true;

  } catch (error) {
    if (requestId !== feedRequestId) return;
    console.error("Error:", error);
    episodeList.innerHTML = "";
    const status = document.getElementById("feedStatus");
    status.textContent = "Unable to load this RSS feed. Check the URL and whether the feed allows browser access (CORS).";
    status.hidden = false;
  } finally {
    if (requestId === feedRequestId) {
      setLoadingState("feed", false);
      feedStatus.classList.remove("is-loading");
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
function playEpisode(url, title) {
  const player = document.getElementById("player");
  const currentEpisodeTitle = document.getElementById("currentEpisodeTitle");

  try {
    // 安全验证URL
    if (!isValidUrl(url)) {
      throw new Error("Invalid audio URL");
    }

    savePlaybackState();
    const saved = readPlaybackState();
    playingPodcastInfo = currentPodcastInfo;
    pendingPlaybackPosition = saved?.url === url ? saved.position : 0;
    player.src = url;
    //Then is using system control to support showing image/title/arthur
    player.play().then(() => {
      if (playingPodcastInfo && "mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: title,
          artist: playingPodcastInfo.author,
          album: playingPodcastInfo.title,
          artwork: generateArtworkArray(playingPodcastInfo.cover),
        });
      }
    }).catch(showPlaybackError);
    document.getElementById("playPauseButton").disabled = false;
    document.getElementById("playerStatus").hidden = true;
    currentEpisodeTitle.textContent = title || "Playing...";
    updatePlayerInfo();

    // 添加播放控制（可选）
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        seekBackward();
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        seekForward();
      });
    }
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
  const cover = document.getElementById("playerCover");
  cover.hidden = !playingPodcastInfo?.cover;
  if (playingPodcastInfo?.cover) cover.src = playingPodcastInfo.cover;
  document.getElementById("playerSubtitle").textContent = playingPodcastInfo
    ? `${playingPodcastInfo.title} · ${playingPodcastInfo.author}` : "Podcasted";
  const canOpen = Boolean(playingPodcastInfo?.feedUrl);
  ["currentEpisodeTitle", "playerSubtitle"].forEach(id => {
    const link = document.getElementById(id);
    link.setAttribute("aria-disabled", String(!canOpen));
    link.tabIndex = canOpen ? 0 : -1;
    link.title = canOpen ? "Open podcast episodes" : "";
  });
}

function openPlayingPodcast(event) {
  event.preventDefault();
  if (!playingPodcastInfo?.feedUrl) return;
  loadPodcastList(playingPodcastInfo.feedUrl);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showPlaybackError(error) {
  console.error("Playback error:", error);
  const status = document.getElementById("playerStatus");
  status.textContent = error?.name === "NotAllowedError"
    ? "Press Play to start listening." : "Unable to play this episode. Please try again.";
  status.hidden = false;
}

function togglePlayback() {
  const player = document.getElementById("player");
  if (!player.currentSrc && !player.getAttribute("src")) return;
  if (player.paused) player.play().catch(showPlaybackError);
  else player.pause();
}

function initializePlayer() {
  const player = document.getElementById("player");
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
    const playing = !player.paused && !player.ended;
    playButton.setAttribute("aria-label", playing ? "Pause" : "Play");
    playButton.title = playing ? "Pause" : "Play";
    playButton.innerHTML = fluentIcon(playing ? "pause" : "play");
    if (playing) document.getElementById("playerStatus").hidden = true;
  };
  ["timeupdate", "loadedmetadata", "durationchange", "emptied"].forEach(event => player.addEventListener(event, updateProgress));
  ["play", "pause", "ended"].forEach(event => player.addEventListener(event, updatePlayback));
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
    muteButton.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    muteButton.title = muted ? "Unmute" : "Mute";
    const volumeIcon = muted ? "muted" : player.volume <= 0.33 ? "volumeLow"
      : player.volume <= 0.66 ? "volumeMedium" : "volume";
    muteButton.innerHTML = fluentIcon(volumeIcon);
  });
  document.getElementById("playerCover").addEventListener("error", event => { event.target.hidden = true; });
  updateProgress();
  updatePlayback();
}

// 添加日期格式化辅助函数
function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

//System media player support

// 生成符合标准的封面数组
function generateArtworkArray(coverUrl) {
  const sizes = [96, 128, 192, 256, 384, 512];
  return sizes.map((size) => ({
    src: `${coverUrl}?size=${size}`, // 假设图片服务支持尺寸参数
    sizes: `${size}x${size}`,
    type: "image/jpeg",
  }));
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
  if (addHistory) recordPage({ type: comedyOnly ? "discover" : "search", query });
  const requestId = ++searchRequestId;
  ++feedRequestId;
  document.getElementById("searchDiv").hidden = false;
  document.getElementById("podcastDetail").hidden = true;
  document.getElementById("browseTitle").textContent = comedyOnly ? "Comedy" : `Results for “${query}”`;
  document.getElementById("browseEyebrow").textContent = comedyOnly ? "Dedicated to creators" : "SEARCH PODCASTS";
  document.getElementById("retryBrowse").hidden = true;

  document.getElementById("searchEmptyState").hidden = true;
  const status = document.getElementById("searchStatus");
  const results = document.getElementById("searchResults");
  status.hidden = false;
  status.textContent = "Searching podcasts...";
  status.classList.add("is-loading");
  setLoadingState("browse", true);
  results.hidden = true;

  try {
    const data = await requestPodcastSearch(query, requestId, comedyOnly);
    if (!status.isConnected || requestId !== searchRequestId) return;
    const podcasts = data.results.filter(podcast => podcast.feedUrl && (!comedyOnly || podcast.genreIds?.includes("1303") || podcast.primaryGenreName === "Comedy"));
    displaySearchResults(podcasts);
    status.textContent = podcasts.length ? "" : "No podcasts found. Try another name or topic.";
    status.hidden = podcasts.length > 0;
    results.hidden = podcasts.length === 0;
  } catch (error) {
    if (!status.isConnected || requestId !== searchRequestId) return;
    console.error("Search failed:", error);
    status.textContent = "Search failed. Please try again.";
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
    button.setAttribute("appearance", "stealth");
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
  if (addHistory) recordPage({ type: "discover", query: "" });
  ++searchRequestId;
  ++feedRequestId;
  document.getElementById("searchInput").value = "";
  document.getElementById("searchDiv").hidden = false;
  document.getElementById("podcastDetail").hidden = true;
  document.getElementById("browseTitle").textContent = "Listen";
  document.getElementById("browseEyebrow").textContent = "Dedicated to creators";
  document.getElementById("searchEmptyState").hidden = false;
  document.getElementById("searchStatus").hidden = true;
  document.getElementById("searchStatus").classList.remove("is-loading");
  document.getElementById("searchResults").hidden = true;
  document.getElementById("searchResults").innerHTML = "";
  document.getElementById("retryBrowse").hidden = true;
  setLoadingState("browse", false);
  setLoadingState("feed", false);
}

// Native form submission supports both Enter and the Search button.
function handleSearchSubmit(event) {
  event.preventDefault();
  const query = document.getElementById("searchInput").value.trim();
  if (!query) { showDiscover(); return; }
  if (/^https?:\/\//i.test(query)) loadPodcastList(query);
  else searchPodcasts(query);
}

function handleRSSURLEnter(event) {
  if (event.key === "Enter") {
    loadPodcastList();
  }
}
