// Microsoft Fluent UI Web Components 3.1.3 (Fluent 2).
// The official browser bundle registers controls and exposes Fluent.setTheme.
(() => {
  window.PodcastedTheme.apply();

  // v3.1.3 has no dropdown control CSS part. Compact only the rate picker,
  // preserving the component's keyboard, popup and selection behavior.
  customElements.whenDefined('fluent-dropdown').then(() => {
    const picker = document.getElementById('playbackRate');
    const styles = document.createElement('style');
    styles.textContent = '.control { min-width: 0 !important; padding: 4px !important; background: transparent !important; box-shadow: none !important; gap: 4px; font-size: var(--rate-font-size, 14px) !important; font-weight: 500; line-height: 24px; }';
    picker.shadowRoot.appendChild(styles);
  });
})();
