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
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === "dark" ? "#121212" : "#f5f7fa";
    if (window.Fluent && window.PodcastedFluentThemes) {
      lightFluentTheme ||= {
        ...window.PodcastedFluentThemes.light,
        colorNeutralForeground1: "#202a38",
        colorNeutralForeground2: "#475569",
        colorNeutralForeground3: "#64748b",
        colorNeutralStroke1: "#d7dfe8",
        colorNeutralStroke2: "#e1e7ee",
        colorBrandBackground: "#4169bd",
        colorBrandBackgroundHover: "#3559a4",
        colorBrandBackgroundPressed: "#2a4887",
        colorBrandBackgroundSelected: "#3559a4",
        colorBrandForeground1: "#3559a4",
        colorBrandStroke1: "#4169bd",
        colorCompoundBrandBackground: "#4169bd",
        colorCompoundBrandBackgroundHover: "#3559a4",
        colorCompoundBrandBackgroundPressed: "#2a4887",
        colorCompoundBrandStroke: "#4169bd",
        colorCompoundBrandStrokeHover: "#3559a4",
        colorCompoundBrandStrokePressed: "#2a4887",
      };
      window.Fluent.setTheme(theme === "light" ? lightFluentTheme : window.PodcastedFluentThemes.dark);
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
