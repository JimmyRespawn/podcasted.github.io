// Pinned Microsoft Fluent UI Web Components 2.6.1, served locally by GitHub Pages.
// See fluent-components.LICENSE.txt for the MIT license.
(() => {
const {
  provideFluentDesignSystem, fluentButton, fluentTextField,
  fluentSelect, fluentOption, fluentSlider,
  baseLayerLuminance, StandardLuminance,
} = window.PodcastedFluentUI;

provideFluentDesignSystem().register(
  fluentButton(), fluentTextField(), fluentSelect(), fluentOption(), fluentSlider(),
);

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
function syncTheme() {
  baseLayerLuminance.setValueFor(document.body,
    systemTheme.matches ? StandardLuminance.DarkMode : StandardLuminance.LightMode);
}
syncTheme();
systemTheme.addEventListener("change", syncTheme);
})();
