// Interface strings only. Podcast metadata always stays in its original language.
(() => {
  const ja = {
    'Listen':'聴く', 'Download App':'アプリをダウンロード', 'Settings':'設定',
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
  const key = 'podcasted.language.v1';
  let preference = 'system';
  try { const saved = localStorage.getItem(key); if (['system','en','ja'].includes(saved)) preference = saved; } catch {}
  let language;
  const bindings = [];
  function t(message, values = {}) {
    const text = language === 'ja' ? ja[message] || message : message;
    return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  }
  function apply() {
    language = preference === 'system' ? (/^ja\b/i.test(navigator.languages?.[0] || navigator.language) ? 'ja' : 'en') : preference;
    document.documentElement.lang = language;
    bindings.forEach(({node, attribute, message}) => {
      if (attribute) node.setAttribute(attribute, t(message));
      else if (node.isConnected) node.nodeValue = t(message);
    });
    // These nodes are replaced by navigation/loading code, so their original text nodes may be detached.
    ['browseTitle', 'browseEyebrow', 'feedStatus', 'searchStatus'].forEach(id => {
      const node = document.getElementById(id);
      if (!node || (id === 'browseTitle' && !['Listen', ja.Listen].includes(node.textContent))) return;
      const message = Object.keys(ja).find(key => key === node.textContent || ja[key] === node.textContent);
      if (message) node.textContent = t(message);
    });
    window.dispatchEvent(new Event('podcastedlanguagechange'));
  }
  window.t = t;
  window.PodcastedI18n = {
    get preference() { return preference; }, get locale() { return language === 'ja' ? 'ja-JP' : 'en-US'; },
    setPreference(value) {
      if (!['system','en','ja'].includes(value) || value === preference) return;
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
