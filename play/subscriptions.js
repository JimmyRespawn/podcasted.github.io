// Keep the latest imported list until the user clears it.
const subscriptionStorageKey = "podcasted.subscriptions.v1";
// Testing only: set to false to hide the channel Subscribe button for release.
const SHOW_SUBSCRIBE_BUTTON = false;
let linkedSubscriptions = null;
let subscriptionImportError = false;
let subscriptionGeneration = 0;
const subscriptionMetadata = new Map();
let subscriptionRequests = [];

function subscriptionHttpUrl(value) {
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid feed URL");
  return url.href;
}

function decodeSubscriptions(encoded) {
  if (!encoded || encoded.length > 1000000) throw new Error("Invalid subscriptions");
  const base64 = encoded.replace(/ /g, "+").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) throw new Error("Invalid Base64");
  const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  const data = JSON.parse(new TextDecoder("utf-8", {fatal: true}).decode(bytes));
  if (data.v !== 1 || !Array.isArray(data.feeds)) throw new Error("Unsupported subscriptions");
  const unique = new Map();
  data.feeds.forEach(value => {
    if (typeof value !== "string") throw new Error("Invalid subscription");
    const feedUrl = subscriptionHttpUrl(value);
    if (!unique.has(feedUrl)) unique.set(feedUrl, {feedUrl});
  });
  return Array.from(unique.values());
}

function readLinkedSubscriptions() {
  const query = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.slice(1));
  const encoded = fragment.has("subs") ? fragment.get("subs") : query.get("subs");
  subscriptionImportError = false;
  if (linkedSubscriptions === null) {
    try {
      const saved = localStorage.getItem(subscriptionStorageKey);
      if (saved) linkedSubscriptions = decodeSubscriptions(saved);
    } catch { /* Invalid or unavailable saved data does not block the homepage. */ }
  }
  if (encoded === null) return;
  try {
    linkedSubscriptions = decodeSubscriptions(encoded);
    try { localStorage.setItem(subscriptionStorageKey, encoded); } catch { /* Imports still work for this visit. */ }
  }
  catch { subscriptionImportError = true; }
}

function clearLinkedSubscriptions() {
  linkedSubscriptions = null;
  try { localStorage.removeItem(subscriptionStorageKey); } catch { /* Storage may be unavailable. */ }
  subscriptionImportError = false;
  removeSubscriptionUrlParameters();
  showDiscover();
}

function removeSubscriptionUrlParameters() {
  const url = new URL(location.href);
  url.searchParams.delete("subs");
  const fragment = new URLSearchParams(url.hash.slice(1));
  if (fragment.has("subs")) {
    fragment.delete("subs");
    url.hash = fragment.toString();
  }
  history.replaceState(null, "", url.href);
}

function removeLinkedSubscription(feedUrl) {
  if (!linkedSubscriptions) return;
  const index = linkedSubscriptions.findIndex(item => item.feedUrl === feedUrl);
  linkedSubscriptions = linkedSubscriptions.filter(item => item.feedUrl !== feedUrl);
  persistLinkedSubscriptions();
  renderLinkedSubscriptions();
  const buttons = document.querySelectorAll("#subscriptionsList .subscription-remove");
  (buttons[Math.min(index, buttons.length - 1)] || document.getElementById("clearSubscriptions")).focus();
}

function persistLinkedSubscriptions() {
  const data = JSON.stringify({v: 1, feeds: (linkedSubscriptions || []).map(item => item.feedUrl)});
  const bytes = new TextEncoder().encode(data);
  const encoded = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(""))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  try { localStorage.setItem(subscriptionStorageKey, encoded); } catch { /* Optional persistence. */ }
  // Prevent the original import link from adding a removed feed again on refresh.
  removeSubscriptionUrlParameters();
  subscriptionImportError = false;
  updateSubscribeButton();
}

function updateSubscribeButton() {
  const button = document.getElementById("subscribePodcastButton");
  button.hidden = !SHOW_SUBSCRIBE_BUTTON || !currentPodcastInfo?.feedUrl;
  const subscribed = Boolean(linkedSubscriptions?.some(item => item.feedUrl === currentPodcastInfo?.feedUrl));
  button.textContent = t(subscribed ? "Subscribed" : "Subscribe");
  button.title = t(subscribed ? "Unsubscribe" : "Subscribe");
  button.setAttribute("aria-pressed", String(subscribed));
  button.setAttribute("appearance", subscribed ? "subtle" : "primary");
}

function toggleCurrentSubscription() {
  if (!SHOW_SUBSCRIBE_BUTTON || !currentPodcastInfo?.feedUrl) return;
  let feedUrl;
  try { feedUrl = subscriptionHttpUrl(currentPodcastInfo.feedUrl); } catch { return; }
  const subscribed = linkedSubscriptions?.some(item => item.feedUrl === feedUrl);
  if (subscribed) linkedSubscriptions = linkedSubscriptions.filter(item => item.feedUrl !== feedUrl);
  else {
    linkedSubscriptions = [...(linkedSubscriptions || []), {feedUrl}];
    subscriptionMetadata.set(feedUrl, {...currentPodcastInfo});
  }
  persistLinkedSubscriptions();
}

function hideLinkedSubscriptions() {
  ++subscriptionGeneration;
  subscriptionRequests.forEach(controller => controller.abort());
  subscriptionRequests = [];
  document.getElementById("subscriptionsPanel").hidden = true;
  document.getElementById("clearSubscriptions").hidden = true;
  document.getElementById("subscriptionStatus").hidden = true;
}

function renderLinkedSubscriptions() {
  hideLinkedSubscriptions();
  const status = document.getElementById("subscriptionStatus");
  status.hidden = !subscriptionImportError;
  status.textContent = subscriptionImportError ? t("Unable to read the subscriptions in this link.") : "";
  if (linkedSubscriptions === null) return;
  const generation = subscriptionGeneration;
  document.getElementById("subscriptionsPanel").hidden = false;
  document.getElementById("clearSubscriptions").hidden = false;
  document.getElementById("searchEmptyState").hidden = true;
  document.getElementById("subscriptionsEmpty").hidden = linkedSubscriptions.length > 0;
  const list = document.getElementById("subscriptionsList");
  list.replaceChildren();
  const cards = linkedSubscriptions.map(subscription => {
    const li = document.createElement("li");
    li.className = "subscription-card";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "subscription-remove";
    remove.innerHTML = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    remove.onclick = event => { event.stopPropagation(); removeLinkedSubscription(subscription.feedUrl); };
    const button = document.createElement("fluent-button");
    button.className = "podcast-card";
    button.setAttribute("appearance", "subtle");
    button.setAttribute("role", "button");
    const artwork = document.createElement("div");
    artwork.className = "card-artwork";
    artwork.innerHTML = fluentIcon("music");
    const title = document.createElement("span");
    title.className = "card-title";
    const author = document.createElement("span");
    author.className = "card-author subscription-feed-url";
    const update = metadata => {
      title.textContent = metadata?.title || new URL(subscription.feedUrl).hostname;
      remove.setAttribute("aria-label", t("Remove subscription") + ": " + title.textContent);
      remove.title = t("Remove subscription");
      author.textContent = metadata?.author || subscription.feedUrl;
      button.title = subscription.feedUrl;
      if (metadata?.cover) {
        const image = document.createElement("img");
        image.alt = "";
        image.loading = "lazy";
        image.src = metadata.cover;
        image.onerror = () => image.remove();
        artwork.appendChild(image);
      }
    };
    update(subscriptionMetadata.get(subscription.feedUrl));
    button.append(artwork, title, author);
    button.onclick = () => selectPodcast(subscription.feedUrl);
    li.append(button, remove);
    list.appendChild(li);
    return {subscription, update};
  });
  // Limit concurrent RSS requests; inaccessible feeds keep a usable URL card.
  const queue = cards.filter(({subscription}) => !subscriptionMetadata.has(subscription.feedUrl));
  async function worker() {
    while (queue.length && generation === subscriptionGeneration) {
      const {subscription, update} = queue.shift();
      const controller = new AbortController();
      subscriptionRequests.push(controller);
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(subscription.feedUrl, {signal: controller.signal});
        if (!response.ok) throw new Error("RSS unavailable");
        const xml = new DOMParser().parseFromString(await response.text(), "application/xml");
        const channel = xml.querySelector("channel");
        if (!channel) throw new Error("Invalid RSS");
        const fields = Array.from(channel.children);
        const title = fields.find(node => node.localName === "title")?.textContent?.trim();
        const cover = parsePodcastCover(channel, response.url || subscription.feedUrl);
        const metadata = {title, author: parsePodcastAuthor(channel), cover};
        if (generation !== subscriptionGeneration) return;
        subscriptionMetadata.set(subscription.feedUrl, metadata);
        update(metadata);
      } catch { /* CORS/offline errors do not prevent opening the channel card. */ }
      finally { clearTimeout(timeout); subscriptionRequests = subscriptionRequests.filter(item => item !== controller); }
    }
  }
  const workers = Math.min(4, queue.length);
  for (let index = 0; index < workers; index++) worker();
}

function initializeSubscriptions() {
  readLinkedSubscriptions();
  updateSubscribeButton();
  document.getElementById("subscribePodcastButton").addEventListener("click", toggleCurrentSubscription);
  document.getElementById("clearSubscriptions").addEventListener("click", clearLinkedSubscriptions);
  window.addEventListener("hashchange", () => { readLinkedSubscriptions(); showDiscover(); });
  window.addEventListener("podcastedlanguagechange", () => {
    updateSubscribeButton();
    if (pageHistory[pageHistoryIndex]?.type === "discover") renderLinkedSubscriptions();
  });
}
