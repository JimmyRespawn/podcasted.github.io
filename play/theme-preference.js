// Apply the saved appearance before styles load to avoid a theme flash.
(() => {
  const storageKey = "podcasted.theme.v1";
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = "system";
  let lightFluentTheme;
  try {
    const saved = localStorage.getItem(storageKey);
    if (["system", "light", "dark"].includes(saved)) preference = saved;
  } catch { /* Appearance still works when local storage is unavailable. */ }
  function apply() {
    const theme = preference === "system" ? (systemTheme.matches ? "dark" : "light") : preference;
    document.documentElement.dataset.theme = theme;
    const accentTokens = window.PodcastedAccent.apply(theme);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = document.documentElement.style.getPropertyValue("--page-bg");
    if (window.Fluent && window.PodcastedFluentThemes) {
      lightFluentTheme ||= {
        ...window.PodcastedFluentThemes.light,
        colorNeutralForeground1: "#202a38",
        colorNeutralForeground2: "#475569",
        colorNeutralForeground3: "#64748b",
        colorNeutralStroke1: "#d7dfe8",
        colorNeutralStroke2: "#e1e7ee",
      };
      window.Fluent.setTheme({ ...(theme === "light" ? lightFluentTheme : window.PodcastedFluentThemes.dark), ...accentTokens });
    }
  }
  window.PodcastedTheme = {
    get preference() { return preference; },
    apply,
    setPreference(value) {
      if (!["system", "light", "dark"].includes(value)) return;
      preference = value;
      try { localStorage.setItem(storageKey, value); } catch { /* Optional persistence. */ }
      apply();
      window.dispatchEvent(new Event("podcastedthemechange"));
    },
  };
  systemTheme.addEventListener("change", apply);
  apply();
})();
