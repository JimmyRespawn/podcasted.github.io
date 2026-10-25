// One primary color generates readable companion shades in both appearances.
(() => {
  const defaultColor = "#4169bd", storageKey = "podcasted.accent.v1";
  let color = defaultColor;
  const valid = value => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  try { const saved = localStorage.getItem(storageKey); if (valid(saved)) color = saved.toLowerCase(); } catch {}
  const rgb = hex => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
  const hex = channels => "#" + channels.map(value => Math.round(value).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, amount) => hex(rgb(a).map((value, index) => value * (1 - amount) + rgb(b)[index] * amount));
  function luminance(value) {
    const linear = rgb(value).map(channel => { const c = channel / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
    return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
  }
  function contrast(a, b) {
    const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (values[0] + .05) / (values[1] + .05);
  }
  function readable(value, background, toward) {
    for (let step = 0; step <= 100; step++) {
      const result = mix(value, toward, step / 100);
      if (contrast(result, background) >= 4.5) return result;
    }
    return toward;
  }
  function apply(theme) {
    const dark = theme === "dark", original = color === defaultColor;
    const surface = dark ? "#202020" : "#ffffff";
    const subtle = dark ? mix(surface, color, .18) : original ? "#eaf0fb" : mix(color, "#ffffff", .9);
    const textBackground = dark && luminance(surface) > luminance(subtle) ? surface : subtle;
    const foreground = readable(dark ? mix(color, "#ffffff", .3) : color, textBackground, dark ? "#ffffff" : "#000000");
    const solid = readable(color, "#ffffff", "#000000");
    const hover = mix(solid, "#000000", .12), pressed = mix(solid, "#000000", .24);
    const page = dark ? "#121212" : original ? "#f5f7fa" : mix(color, "#ffffff", .975);
    const variables = {
      "--page-bg": page, "--surface": surface,
      "--surface-muted": dark ? "#292929" : original ? "#eef2f6" : mix(color, "#ffffff", .95),
      "--input-bg": dark ? "#303030" : original ? "#edf1f5" : mix(color, "#ffffff", .94),
      "--search-bg": dark ? "#303030" : "#ffffff",
      "--search-border": dark ? "#444444" : original ? "#d7dfe8" : mix(solid, "#ffffff", .78),
      "--border": dark ? "#444444" : original ? "#e1e7ee" : mix(solid, "#ffffff", .88),
      "--list-hover": dark ? mix(surface, color, .12) : original ? "#f0f4fa" : mix(color, "#ffffff", .95),
      "--control-bg": dark ? "#333333" : original ? "#edf1f5" : mix(color, "#ffffff", .94),
      "--control-hover": dark ? mix(surface, color, .22) : original ? "#e3eaf3" : mix(color, "#ffffff", .86),
      "--accent": solid, "--focus": foreground, "--accent-text": foreground,
      "--accent-subtle": subtle, "--accent-muted": mix(foreground, page, .4),
      "--accent-ring": `rgba(${rgb(color).join(", ")}, 0.16)`,
    };
    Object.entries(variables).forEach(([name, value]) => document.documentElement.style.setProperty(name, value));
    const tokens = {
      colorBrandBackground: solid, colorBrandBackgroundHover: hover, colorBrandBackgroundPressed: pressed,
      colorBrandBackgroundSelected: hover, colorBrandBackgroundStatic: solid,
      colorBrandBackground2: subtle, colorBrandBackground2Hover: mix(subtle, color, .05), colorBrandBackground2Pressed: mix(subtle, color, .1),
      colorCompoundBrandBackground: solid, colorCompoundBrandBackgroundHover: hover, colorCompoundBrandBackgroundPressed: pressed,
      colorBrandForeground1: foreground, colorBrandForeground2: foreground,
      colorBrandForeground2Hover: foreground, colorBrandForeground2Pressed: foreground,
      colorBrandForegroundLink: foreground, colorBrandForegroundLinkHover: foreground,
      colorBrandForegroundLinkPressed: foreground, colorBrandForegroundLinkSelected: foreground,
      colorCompoundBrandForeground1: foreground, colorCompoundBrandForeground1Hover: foreground, colorCompoundBrandForeground1Pressed: foreground,
      colorBrandStroke1: foreground, colorBrandStroke2: subtle, colorBrandStroke2Hover: foreground,
      colorBrandStroke2Pressed: foreground, colorBrandStroke2Contrast: foreground,
      colorCompoundBrandStroke: foreground, colorCompoundBrandStrokeHover: foreground, colorCompoundBrandStrokePressed: foreground,
      colorNeutralForegroundOnBrand: "#ffffff",
    };
    [2, 3].forEach(level => ["Hover", "Pressed", "Selected"].forEach(state => { tokens[`colorNeutralForeground${level}Brand${state}`] = foreground; }));
    return tokens;
  }
  window.PodcastedAccent = {
    get color() { return color; }, defaultColor, apply,
    setColor(value) {
      if (!valid(value) || value.toLowerCase() === color) return;
      color = value.toLowerCase();
      try { localStorage.setItem(storageKey, color); } catch {}
      window.PodcastedTheme.apply();
      window.dispatchEvent(new Event("podcastedaccentchange"));
    },
  };
})();
