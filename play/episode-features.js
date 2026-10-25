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
    li.dataset.audioUrl = episode.audioUrl;
    li.innerHTML = `<div class="episode-copy"><button type="button" class="episode-title episode-details-link">${escapeHTML(episode.title)}</button><div class="episode-meta"><span class="duration">${escapeHTML(episode.duration)}</span><span class="pub-date" data-date="${escapeHTML(episode.pubDate)}">${formatDate(episode.pubDate)}</span></div></div><fluent-button appearance="subtle" class="episode-play" type="button" title="${escapeHTML(t("Play episode"))}" aria-label="${escapeHTML(t("Play episode") + ': ' + episode.title)}">${fluentIcon("play")}</fluent-button>`;
    const actions = document.createElement("div");
    const status = document.createElement("span");
    status.className = "episode-now-playing";
    status.hidden = true;
    status.innerHTML = '<span class="queue-playing-indicator" aria-hidden="true"><i></i><i></i><i></i></span><span class="episode-playback-label"></span>';
    li.querySelector(".episode-meta").appendChild(status);
    actions.className = "episode-row-actions";
    const share = document.createElement("button");
    share.type = "button";
    share.className = "episode-share";
    share.title = t("Share episode");
    share.setAttribute("aria-label", t("Share episode") + ": " + episode.title);
    share.disabled = !episode.podcast?.feedUrl;
    share.innerHTML = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none"><path d="M12 15V3m-4 4 4-4 4 4M8 11H5.75A1.75 1.75 0 0 0 4 12.75v5.5C4 19.22 4.78 20 5.75 20h12.5c.97 0 1.75-.78 1.75-1.75v-5.5c0-.97-.78-1.75-1.75-1.75H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    share.onclick = event => { event.stopPropagation(); openShareDialog(episode); };
    actions.append(share, createQueueAddButton(episode), li.querySelector(".episode-play"));
    li.appendChild(actions);
    li.querySelector(".episode-details-link").addEventListener("click", event => {
      event.stopPropagation();
      showEpisodeDetails(episode);
    });
    li.addEventListener("click", () => playEpisode(episode.audioUrl, episode.title, episode));
    list.appendChild(li);
  });
  updateEpisodeListPlaybackState();
}

function updateEpisodeListPlaybackState() {
  const player = document.getElementById("player");
  document.querySelectorAll("#episodeList li[data-audio-url]").forEach(row => {
    let current = false;
    try { current = Boolean(player.getAttribute("src")) && !player.ended && new URL(row.dataset.audioUrl, location.href).href === player.src; } catch {}
    const status = row.querySelector(".episode-now-playing");
    status.hidden = !current;
    status.classList.toggle("is-paused", player.paused);
    if (current) {
      status.querySelector(".episode-playback-label").textContent = t(player.paused ? "Paused" : "NOW PLAYING");
      row.setAttribute("aria-current", "true");
    } else row.removeAttribute("aria-current");
  });
}

function renderEpisodeShownotes(episode) {
  const container = document.getElementById("episodeDetailDescription");
  const timestamp = /^(?:\d{1,3}:[0-5]\d:[0-5]\d|\d{1,3}:[0-5]\d)$/;
  let base;
  for (const candidate of [episode.link, episode.podcast?.feedUrl]) {
    try { const url = new URL(candidate); if (["http:", "https:"].includes(url.protocol)) { base = url.href; break; } } catch {}
  }
  function safeLink(href) {
    try {
      const url = new URL(href, base);
      return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }
  function link(href) {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    return anchor;
  }
  function timeButton(text) {
    const seconds = text.split(":").reduce((total, part) => total * 60 + Number(part), 0);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "shownote-timestamp";
    button.textContent = text;
    button.setAttribute("aria-label", t("Play from {time}", {time: text}));
    button.title = t("Play from {time}", {time: text});
    button.disabled = !episode.audioUrl;
    button.onclick = () => playEpisodeFromTimestamp(episode, seconds);
    return button;
  }
  function appendText(parent, text) {
    // Match whole URLs before times, so URL query parameters never become buttons.
    const pattern = /https?:\/\/[^\s<>"'“”「」。，；！？]+|(?<![\w@])www\.[^\s<>"'“”「」。，；！？]+|(?<![\d:/])(?:\d{1,3}:[0-5]\d:[0-5]\d|\d{1,3}:[0-5]\d)(?![\d:])/gi;
    let cursor = 0;
    for (const match of text.matchAll(pattern)) {
      parent.appendChild(document.createTextNode(text.slice(cursor, match.index)));
      if (timestamp.test(match[0])) parent.appendChild(timeButton(match[0]));
      else {
        let label = match[0].replace(/[.,;:!?，。；！？、”’」』]+$/, "");
        const brackets = { ")": "(", "]": "[", "}": "{", "）": "（", "】": "【" };
        while (brackets[label.slice(-1)]) {
          const close = label.slice(-1), open = brackets[close];
          if (label.split(close).length <= label.split(open).length) break;
          label = label.slice(0, -1);
        }
        const href = safeLink(/^www\./i.test(label) ? "https://" + label : label);
        if (href) { const anchor = link(href); anchor.textContent = label; parent.appendChild(anchor); }
        else parent.appendChild(document.createTextNode(label));
        parent.appendChild(document.createTextNode(match[0].slice(label.length)));
      }
      cursor = match.index + match[0].length;
    }
    parent.appendChild(document.createTextNode(text.slice(cursor)));
  }

  const fragment = document.createDocumentFragment();
  const raw = episode.descriptionHtml;
  const html = typeof raw === "string" && /<\/?[a-z][^>]*>/i.test(raw);
  container.classList.toggle("shownotes-html", Boolean(html));
  if (html) {
    // The source remains inert; rebuild allowed elements without source attributes.
    const template = document.createElement("template");
    template.innerHTML = raw;
    const allowed = new Set(["p", "div", "br", "hr", "span", "strong", "em", "b", "i", "u", "s", "small", "sup", "sub", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "dl", "dt", "dd", "blockquote", "pre", "code"]);
    const blocked = new Set(["script", "style", "iframe", "object", "embed", "svg", "math", "form", "input", "button", "select", "textarea", "template", "noscript", "img", "video", "audio", "link", "meta", "base"]);
    function appendSafe(source, target, depth = 0, insideLink = false) {
      if (depth > 60) return;
      if (source.nodeType === Node.TEXT_NODE) {
        if (insideLink) target.appendChild(document.createTextNode(source.nodeValue));
        else appendText(target, source.nodeValue);
        return;
      }
      if (source.nodeType !== Node.ELEMENT_NODE || blocked.has(source.localName)) return;
      const tag = source.localName;
      let destination = target;
      let anchor = false;
      if (tag === "a" && !insideLink) {
        const label = source.textContent.trim();
        if (timestamp.test(label)) { target.appendChild(timeButton(label)); return; }
        const href = safeLink(source.getAttribute("href") || "");
        if (href && source.hasAttribute("href")) { destination = link(href); anchor = true; }
      } else if (allowed.has(tag)) destination = document.createElement(tag);
      source.childNodes.forEach(child => appendSafe(child, destination, depth + 1, insideLink || anchor));
      if (destination !== target) target.appendChild(destination);
    }
    template.content.childNodes.forEach(node => appendSafe(node, fragment));
  } else appendText(fragment, episode.description || raw || t("No description available for this episode."));
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
  ["play", "pause", "ended", "emptied"].forEach(event => document.getElementById("player").addEventListener(event, updateEpisodeListPlaybackState));
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
