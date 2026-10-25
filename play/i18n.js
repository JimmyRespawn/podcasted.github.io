// Interface strings only. Podcast metadata always stays in its original language.
(() => {
  const ja = {
    'Play from {time}':'{time} から再生',
    'More options':'その他のオプション', 'Mini Player':'ミニプレーヤー', 'Close Mini Player':'ミニプレーヤーを閉じる',
    'Mini Player is not supported in this browser.':'このブラウザーはミニプレーヤーに対応していません。',
    'Unable to open Mini Player. Please try again.':'ミニプレーヤーを開けません。もう一度お試しください。',
    'Paused':'一時停止中',
    "Queue": "再生キュー",
    "UP NEXT": "次に再生",
    "Add to queue": "キューに追加",
    "Already in queue": "追加済み",
    "Added to queue.": "キューに追加しました。",
    "Move up": "上に移動",
    "Move down": "下に移動",
    "Remove from queue": "キューから削除",
    "Clear queue": "キューを空にする",
    "Play queue": "キューを再生",
    "Your queue is empty": "キューは空です",
    "Add episodes using the + button or from episode details.": "＋ボタンまたはエピソードの詳細から追加できます。",
    "Episodes play in order after the current episode ends.": "現在のエピソードが終わると、順番に再生します。",
    'Remove subscription':'登録を解除',
    'Your subscriptions':'登録中の番組', 'Clear':'クリア', 'No subscriptions in this list.':'このリストに登録された番組はありません。',
    'Unable to read the subscriptions in this link.':'このリンクの登録番組リストを読み取れません。',
    "Search episode titles": "エピソードのタイトルを検索",
    "Sort episodes": "エピソードの並び順",
    "Newest first": "新しい順",
    "Oldest first": "古い順",
    "Share podcast": "番組を共有",
    "Share episode": "エピソードを共有",
    "No matching episodes.": "一致するエピソードはありません。",
    "Share": "共有",
    "Start at": "開始位置",
    "Start time": "開始時間",
    "Share link": "共有リンク",
    "Copy link": "リンクをコピー",
    "Link copied.": "リンクをコピーしました。",
    "Select and copy the link above.": "上のリンクを選択してコピーしてください。",
    "Enter a time such as 12:30.": "12:30 のように時間を入力してください。",
    "Open the hosted website to create a shareable link.": "公開されたウェブサイトで共有リンクを作成してください。",
    "This shared episode could not be found in the feed.": "共有されたエピソードがフィード内に見つかりません。",
    'Try opening this feed in Podcasted for Windows.':'Podcasted for Windows でこのフィードを開いてみてください。',
    'Download Podcasted for Windows':'Podcasted for Windows をダウンロード',
    'Clear search':'検索欄をクリア', 'Listen':'聴く', 'Download App':'アプリをダウンロード', 'Settings':'設定',
    'Dedicated to creators':'クリエイターのために', 'Dedicated to creators.':'クリエイターのために。',
    'Find your next favorite podcast':'お気に入りのポッドキャストを見つけよう',
    'Use the search box above to find a podcast by name or topic, or paste an RSS URL to start listening.':'上の検索欄で番組名やトピックを検索するか、RSS URL を貼り付けて再生できます。',
    'APP':'アプリ', 'Theme':'テーマ', 'Choose how Podcasted looks.':'Podcasted の外観を選択します。',
    'System':'システム', 'Light':'ライト', 'Dark':'ダーク', 'Language':'言語',
    'Choose the interface language.':'表示言語を選択します。', 'Playback':'再生',
    'Sleep timer':'スリープタイマー', 'Pause playback after a set time.':'指定した時間が経過すると再生を一時停止します。',
    'Off':'オフ', '15 minutes':'15 分', '30 minutes':'30 分', '45 minutes':'45 分', '60 minutes':'60 分', '90 minutes':'90 分',
    'Keyboard shortcuts':'キーボードショートカット', 'Available when you are not typing or using a control.':'文字入力中やコントロールの操作中以外で使用できます。',
    'Play / pause':'再生 / 一時停止', 'Back 15 seconds':'15 秒戻る', 'Forward 30 seconds':'30 秒進む',
    'Volume up / down':'音量を上げる / 下げる', 'Mute / unmute':'ミュート / 解除',
    'Expand / collapse player':'プレーヤーを拡大 / 縮小', 'Close expanded player':'拡大プレーヤーを閉じる',
    'About':'このアプリについて', 'Podcasted Web Player':'Podcasted Web プレーヤー',
    'Find podcasts, open an RSS feed, and keep listening where you left off.':'番組を検索し、RSS フィードを開いて、前回の続きから聴けます。',
    'Your theme and listening progress are saved in this browser.':'テーマと再生位置はこのブラウザーに保存されます。',
    'Source on GitHub':'GitHub でソースを見る', 'NOW PLAYING':'再生中', 'EPISODE':'エピソード',
    'About this episode':'このエピソードについて', 'Episode website':'エピソードのウェブサイト',
    'Choose an episode to start listening':'エピソードを選んで再生してください',
    'Close':'閉じる', 'Back':'戻る', 'Forward':'進む', 'Search':'検索', 'Try again':'再試行',
    'Search or enter RSS URL':'検索または RSS URL を入力', 'Search podcasts or enter RSS URL':'番組を検索または RSS URL を入力',
    'Main navigation':'メインナビゲーション', 'App navigation':'アプリナビゲーション', 'Page navigation':'ページナビゲーション',
    'Podcast player':'ポッドキャストプレーヤー', 'Playback position':'再生位置', 'Playback speed':'再生速度', 'Volume':'音量',
    'Dismiss message':'メッセージを閉じる', 'Open full-screen player':'全画面プレーヤーを開く', 'Close full-screen player':'全画面プレーヤーを閉じる',
    'Play':'再生', 'Pause':'一時停止', 'Resume':'再開', 'Play episode':'エピソードを再生', 'Mute':'ミュート', 'Unmute':'ミュート解除',
    'Open episode details':'エピソードの詳細を開く', 'Open podcast episodes':'番組のエピソード一覧を開く',
    'Progress restored. Press Play to continue.':'再生位置を復元しました。再生ボタンで続けられます。',
    'Press Play to start listening.':'再生ボタンを押してお聴きください。',
    'Unable to play this episode. Please try again.':'このエピソードを再生できません。もう一度お試しください。',
    'Loading episodes…':'エピソードを読み込み中…',
    'Unable to load this RSS feed. Check the URL and whether the feed allows browser access (CORS).':'RSS フィードを読み込めません。URL とブラウザーからのアクセス許可（CORS）を確認してください。',
    'No podcasts found. Try another name or topic.':'番組が見つかりません。別の名前やトピックをお試しください。',
    'Search failed. Please try again.':'検索できませんでした。もう一度お試しください。',
    'SEARCH PODCASTS':'ポッドキャストを検索', 'Results for “{query}”':'「{query}」の検索結果',
    'Sleep timer finished. Playback paused.':'スリープタイマーが終了し、再生を一時停止しました。',
    'Playback pauses in {time}. Choose Off to cancel.':'あと {time} で一時停止します。オフを選択すると解除できます。',
    'Sleep timer: {time} remaining':'スリープタイマー：残り {time}',
    'No description available for this episode.':'このエピソードには説明がありません。'
  };
  const fr = {
    'Play from {time}':'Lire à partir de {time}',
    'More options':'Plus d’options', 'Mini Player':'Mini-lecteur', 'Close Mini Player':'Fermer le mini-lecteur',
    'Mini Player is not supported in this browser.':'Ce navigateur ne prend pas en charge le mini-lecteur.',
    'Unable to open Mini Player. Please try again.':'Impossible d’ouvrir le mini-lecteur. Veuillez réessayer.',
    'Paused':'En pause',
    "Queue": "File d’attente",
    "UP NEXT": "À SUIVRE",
    "Add to queue": "Ajouter à la file",
    "Already in queue": "Déjà dans la file",
    "Added to queue.": "Ajouté à la file d’attente.",
    "Move up": "Monter",
    "Move down": "Descendre",
    "Remove from queue": "Retirer de la file",
    "Clear queue": "Vider la file",
    "Play queue": "Lire la file",
    "Your queue is empty": "Votre file est vide",
    "Add episodes using the + button or from episode details.": "Ajoutez des épisodes avec le bouton + ou depuis leurs détails.",
    "Episodes play in order after the current episode ends.": "Les épisodes seront lus dans l’ordre après l’épisode en cours.",
    'Remove subscription':'Supprimer l’abonnement',
    'Your subscriptions':'Vos abonnements', 'Clear':'Effacer', 'No subscriptions in this list.':'Aucun abonnement dans cette liste.',
    'Unable to read the subscriptions in this link.':'Impossible de lire les abonnements de ce lien.',
    "Search episode titles": "Rechercher un titre d’épisode",
    "Sort episodes": "Trier les épisodes",
    "Newest first": "Les plus récents",
    "Oldest first": "Les plus anciens",
    "Share podcast": "Partager le podcast",
    "Share episode": "Partager l’épisode",
    "No matching episodes.": "Aucun épisode correspondant.",
    "Share": "Partager",
    "Start at": "Commencer à",
    "Start time": "Heure de début",
    "Share link": "Lien de partage",
    "Copy link": "Copier le lien",
    "Link copied.": "Lien copié.",
    "Select and copy the link above.": "Sélectionnez et copiez le lien ci-dessus.",
    "Enter a time such as 12:30.": "Saisissez une durée comme 12:30.",
    "Open the hosted website to create a shareable link.": "Ouvrez le site en ligne pour créer un lien à partager.",
    "This shared episode could not be found in the feed.": "Cet épisode partagé est introuvable dans le flux.",
    'Try opening this feed in Podcasted for Windows.':'Essayez d’ouvrir ce flux dans Podcasted pour Windows.',
    'Download Podcasted for Windows':'Télécharger Podcasted pour Windows',
    'Clear search':'Effacer la recherche', 'Listen':'Écouter', 'Download App':'Télécharger l’application', 'Settings':'Paramètres',
    'Dedicated to creators':'Au service des créateurs', 'Dedicated to creators.':'Au service des créateurs.',
    'Find your next favorite podcast':'Trouvez votre prochain podcast préféré',
    'Use the search box above to find a podcast by name or topic, or paste an RSS URL to start listening.':'Recherchez un podcast par nom ou par sujet ci-dessus, ou collez l’URL d’un flux RSS pour commencer l’écoute.',
    'APP':'APPLICATION', 'Theme':'Thème', 'Choose how Podcasted looks.':'Choisissez l’apparence de Podcasted.',
    'System':'Système', 'Light':'Clair', 'Dark':'Sombre', 'Language':'Langue',
    'Choose the interface language.':'Choisissez la langue de l’interface.', 'Playback':'Lecture',
    'Sleep timer':'Minuterie de veille', 'Pause playback after a set time.':'Mettez la lecture en pause après un délai défini.',
    'Off':'Désactivée', '15 minutes':'15 minutes', '30 minutes':'30 minutes', '45 minutes':'45 minutes', '60 minutes':'60 minutes', '90 minutes':'90 minutes',
    'Keyboard shortcuts':'Raccourcis clavier', 'Available when you are not typing or using a control.':'Disponibles lorsque vous ne saisissez pas de texte et n’utilisez pas de commande.',
    'Play / pause':'Lecture / pause', 'Back 15 seconds':'Reculer de 15 secondes', 'Forward 30 seconds':'Avancer de 30 secondes',
    'Volume up / down':'Augmenter / diminuer le volume', 'Mute / unmute':'Couper / rétablir le son',
    'Expand / collapse player':'Agrandir / réduire le lecteur', 'Close expanded player':'Fermer le lecteur agrandi',
    'About':'À propos', 'Podcasted Web Player':'Lecteur web Podcasted',
    'Find podcasts, open an RSS feed, and keep listening where you left off.':'Trouvez des podcasts, ouvrez un flux RSS et reprenez l’écoute là où vous l’avez laissée.',
    'Your theme and listening progress are saved in this browser.':'Votre thème et votre progression sont enregistrés dans ce navigateur.',
    'Source on GitHub':'Code source sur GitHub', 'NOW PLAYING':'EN COURS DE LECTURE', 'EPISODE':'ÉPISODE',
    'About this episode':'À propos de cet épisode', 'Episode website':'Site web de l’épisode',
    'Choose an episode to start listening':'Choisissez un épisode pour commencer l’écoute',
    'Close':'Fermer', 'Back':'Précédent', 'Forward':'Suivant', 'Search':'Rechercher', 'Try again':'Réessayer',
    'Search or enter RSS URL':'Rechercher ou saisir une URL RSS', 'Search podcasts or enter RSS URL':'Rechercher des podcasts ou saisir une URL RSS',
    'Main navigation':'Navigation principale', 'App navigation':'Navigation de l’application', 'Page navigation':'Navigation des pages',
    'Podcast player':'Lecteur de podcasts', 'Playback position':'Position de lecture', 'Playback speed':'Vitesse de lecture', 'Volume':'Volume',
    'Dismiss message':'Fermer le message', 'Open full-screen player':'Ouvrir le lecteur en plein écran', 'Close full-screen player':'Fermer le lecteur en plein écran',
    'Play':'Lire', 'Pause':'Pause', 'Resume':'Reprendre', 'Play episode':'Lire l’épisode', 'Mute':'Couper le son', 'Unmute':'Rétablir le son',
    'Open episode details':'Ouvrir les détails de l’épisode', 'Open podcast episodes':'Ouvrir les épisodes du podcast',
    'Progress restored. Press Play to continue.':'Progression restaurée. Appuyez sur Lire pour continuer.',
    'Press Play to start listening.':'Appuyez sur Lire pour commencer l’écoute.',
    'Unable to play this episode. Please try again.':'Impossible de lire cet épisode. Veuillez réessayer.',
    'Loading episodes…':'Chargement des épisodes…',
    'Unable to load this RSS feed. Check the URL and whether the feed allows browser access (CORS).':'Impossible de charger ce flux RSS. Vérifiez l’URL et si le flux autorise l’accès depuis le navigateur (CORS).',
    'No podcasts found. Try another name or topic.':'Aucun podcast trouvé. Essayez un autre nom ou sujet.',
    'Search failed. Please try again.':'La recherche a échoué. Veuillez réessayer.',
    'SEARCH PODCASTS':'RECHERCHER DES PODCASTS', 'Results for “{query}”':'Résultats pour « {query} »',
    'Sleep timer finished. Playback paused.':'Minuterie terminée. Lecture mise en pause.',
    'Playback pauses in {time}. Choose Off to cancel.':'La lecture sera mise en pause dans {time}. Sélectionnez Désactivée pour annuler.',
    'Sleep timer: {time} remaining':'Minuterie de veille : {time} restantes',
    'No description available for this episode.':'Aucune description disponible pour cet épisode.'
  };
  const zhHant = {
    'Play from {time}':'從 {time} 開始播放',
    'More options':'更多選項', 'Mini Player':'迷你播放器', 'Close Mini Player':'關閉迷你播放器',
    'Mini Player is not supported in this browser.':'此瀏覽器不支援迷你播放器。',
    'Unable to open Mini Player. Please try again.':'無法開啟迷你播放器，請再試一次。',
    'Paused':'已暫停',
    "Queue": "待播清單",
    "UP NEXT": "接下來播放",
    "Add to queue": "加入待播清單",
    "Already in queue": "已在待播清單中",
    "Added to queue.": "已加入待播清單。",
    "Move up": "上移",
    "Move down": "下移",
    "Remove from queue": "從待播清單移除",
    "Clear queue": "清空待播清單",
    "Play queue": "播放待播清單",
    "Your queue is empty": "待播清單是空的",
    "Add episodes using the + button or from episode details.": "使用＋按鈕或從單集詳情加入節目。",
    "Episodes play in order after the current episode ends.": "目前單集播放完畢後，將依序播放清單中的單集。",
    'Remove subscription':'移除訂閱',
    'Your subscriptions':'你的訂閱', 'Clear':'清除', 'No subscriptions in this list.':'此列表沒有訂閱的節目。',
    'Unable to read the subscriptions in this link.':'無法讀取此連結中的訂閱列表。',
    'Search episode titles':'搜尋單集標題', 'Sort episodes':'單集排序', 'Newest first':'由新到舊', 'Oldest first':'由舊到新',
    'Share podcast':'分享節目', 'Share episode':'分享單集', 'No matching episodes.':'找不到符合的單集。',
    'Share':'分享', 'Start at':'開始位置', 'Start time':'開始時間', 'Share link':'分享連結', 'Copy link':'複製連結',
    'Link copied.':'已複製連結。', 'Select and copy the link above.':'請選取並複製上方連結。',
    'Enter a time such as 12:30.':'請輸入時間，例如 12:30。',
    'Open the hosted website to create a shareable link.':'請開啟線上網站以建立分享連結。',
    'This shared episode could not be found in the feed.':'無法在 RSS 訂閱來源中找到分享的單集。',
    'Try opening this feed in Podcasted for Windows.':'試試使用 Podcasted for Windows 開啟此 RSS 訂閱來源。',
    'Download Podcasted for Windows':'下載 Podcasted for Windows',
    'Clear search':'清除搜尋', 'Listen':'聆聽', 'Download App':'下載應用程式', 'Settings':'設定',
    'Dedicated to creators':'獻給創作者', 'Dedicated to creators.':'獻給創作者。',
    'Find your next favorite podcast':'尋找下一個喜愛的 Podcast',
    'Use the search box above to find a podcast by name or topic, or paste an RSS URL to start listening.':'在上方搜尋框輸入節目名稱或主題，或貼上 RSS 網址，即可開始聆聽。',
    'APP':'應用程式', 'Theme':'佈景主題', 'Choose how Podcasted looks.':'選擇 Podcasted 的外觀。',
    'System':'跟隨系統', 'Light':'淺色', 'Dark':'深色', 'Language':'語言',
    'Choose the interface language.':'選擇介面語言。', 'Playback':'播放',
    'Sleep timer':'睡眠計時器', 'Pause playback after a set time.':'在指定時間後暫停播放。',
    'Off':'關閉', '15 minutes':'15 分鐘', '30 minutes':'30 分鐘', '45 minutes':'45 分鐘', '60 minutes':'60 分鐘', '90 minutes':'90 分鐘',
    'Keyboard shortcuts':'鍵盤快速鍵', 'Available when you are not typing or using a control.':'未輸入文字或操作控制項時可使用。',
    'Play / pause':'播放／暫停', 'Back 15 seconds':'倒退 15 秒', 'Forward 30 seconds':'快轉 30 秒',
    'Volume up / down':'提高／降低音量', 'Mute / unmute':'靜音／取消靜音',
    'Expand / collapse player':'展開／收合播放器', 'Close expanded player':'關閉展開的播放器',
    'About':'關於', 'Podcasted Web Player':'Podcasted 網頁播放器',
    'Find podcasts, open an RSS feed, and keep listening where you left off.':'搜尋節目、開啟 RSS 訂閱來源，隨時從上次的位置繼續聆聽。',
    'Your theme and listening progress are saved in this browser.':'佈景主題與播放進度會儲存在此瀏覽器中。',
    'Source on GitHub':'在 GitHub 查看原始碼', 'NOW PLAYING':'正在播放', 'EPISODE':'單集',
    'About this episode':'關於此單集', 'Episode website':'單集網站',
    'Choose an episode to start listening':'選擇單集以開始聆聽',
    'Close':'關閉', 'Back':'上一頁', 'Forward':'下一頁', 'Search':'搜尋', 'Try again':'重試',
    'Search or enter RSS URL':'搜尋或輸入 RSS 網址', 'Search podcasts or enter RSS URL':'搜尋 Podcast 或輸入 RSS 網址',
    'Main navigation':'主要導覽', 'App navigation':'應用程式導覽', 'Page navigation':'頁面導覽',
    'Podcast player':'Podcast 播放器', 'Playback position':'播放位置', 'Playback speed':'播放速度', 'Volume':'音量',
    'Dismiss message':'關閉訊息', 'Open full-screen player':'開啟全螢幕播放器', 'Close full-screen player':'關閉全螢幕播放器',
    'Play':'播放', 'Pause':'暫停', 'Resume':'繼續播放', 'Play episode':'播放單集', 'Mute':'靜音', 'Unmute':'取消靜音',
    'Open episode details':'開啟單集詳情', 'Open podcast episodes':'開啟節目單集列表',
    'Progress restored. Press Play to continue.':'已還原播放進度，按下播放即可繼續聆聽。',
    'Press Play to start listening.':'按下播放以開始聆聽。',
    'Unable to play this episode. Please try again.':'無法播放此單集，請再試一次。',
    'Loading episodes…':'正在載入單集…',
    'Unable to load this RSS feed. Check the URL and whether the feed allows browser access (CORS).':'無法載入此 RSS 訂閱來源。請檢查網址，以及來源是否允許瀏覽器存取（CORS）。',
    'No podcasts found. Try another name or topic.':'找不到節目，請嘗試其他名稱或主題。',
    'Search failed. Please try again.':'搜尋失敗，請再試一次。',
    'SEARCH PODCASTS':'搜尋 Podcast', 'Results for “{query}”':'「{query}」的搜尋結果',
    'Sleep timer finished. Playback paused.':'睡眠計時器已結束，播放已暫停。',
    'Playback pauses in {time}. Choose Off to cancel.':'將於 {time} 後暫停播放。選擇「關閉」即可取消。',
    'Sleep timer: {time} remaining':'睡眠計時器：剩餘 {time}',
    'No description available for this episode.':'此單集沒有提供說明。'
  };
  const translations = { ja, fr, 'zh-Hant': zhHant };
  const supported = ['system', 'en', 'ja', 'fr', 'zh-Hant'];
  const key = 'podcasted.language.v1';
  let preference = 'system';
  try { const saved = localStorage.getItem(key); if (supported.includes(saved)) preference = saved; } catch {}
  let language;
  const bindings = [];
  function t(message, values = {}) {
    const text = translations[language]?.[message] || message;
    return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  }
  function apply() {
    const browserTag = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
    const browserLanguage = /^zh-(?:hant(?:-|$)|(?:tw|hk|mo)$)/.test(browserTag)
      ? 'zh-Hant' : browserTag.split('-')[0];
    language = preference === 'system' ? (translations[browserLanguage] ? browserLanguage : 'en') : preference;
    document.documentElement.lang = language;
    bindings.forEach(({node, attribute, message}) => {
      if (attribute) node.setAttribute(attribute, t(message));
      else if (node.isConnected) node.nodeValue = t(message);
    });
    // These nodes are replaced by navigation/loading code, so their original text nodes may be detached.
    ['browseTitle', 'browseEyebrow', 'feedStatus', 'searchStatus'].forEach(id => {
      const node = document.getElementById(id);
      if (!node || (id === 'browseTitle' && !['Listen', ...Object.values(translations).map(dictionary => dictionary.Listen)].includes(node.textContent))) return;
      const message = Object.keys(ja).find(key => key === node.textContent || Object.values(translations).some(dictionary => dictionary[key] === node.textContent));
      if (message) node.textContent = t(message);
    });
    window.dispatchEvent(new Event('podcastedlanguagechange'));
  }
  window.t = t;
  window.PodcastedI18n = {
    get preference() { return preference; }, get locale() { return { ja: 'ja-JP', fr: 'fr-FR', en: 'en-US', 'zh-Hant': 'zh-TW' }[language]; },
    setPreference(value) {
      if (!supported.includes(value) || value === preference) return;
      preference = value;
      try { localStorage.setItem(key, value); } catch {}
      apply();
    }
  };
  // Capture only original static interface nodes, before any feed is rendered.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode, message = node.nodeValue.trim();
    if (ja[message] && !node.parentElement.closest('script,style')) bindings.push({node, message});
  }
  document.querySelectorAll('[title],[aria-label],[placeholder]').forEach(node => {
    ['title','aria-label','placeholder'].forEach(attribute => {
      const message = node.getAttribute(attribute);
      if (ja[message]) bindings.push({node, attribute, message});
    });
  });
  apply();
  window.addEventListener('languagechange', () => { if (preference === 'system') apply(); });
})();
