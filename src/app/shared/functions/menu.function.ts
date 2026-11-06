/**
 * Closes all active Angular Material menus / CDK overlay menus.
 * Called whenever a modal, delete-confirm dialog, side panel, or sidebar opens.
 *
 * NOTE: Never dispatch Escape or click events on `document` or `window`, as
 * modals and side panels have `@HostListener('document:keydown.escape')` and
 * will immediately close themselves. Target only elements inside `.cdk-overlay-container`.
 */
export function closeAllMatMenus(): void {
  if (typeof document === 'undefined') return;

  try {
    // 1. Click all backdrops in the CDK overlay container.
    // In Angular CDK Overlay, clicking the overlay backdrop directly triggers
    // OverlayRef.backdropClick(), cleanly closing active MatMenu instances.
    const backdrops = document.querySelectorAll<HTMLElement>(
      '.cdk-overlay-container .cdk-overlay-backdrop, .cdk-overlay-backdrop',
    );
    backdrops.forEach((backdrop) => {
      try {
        backdrop.click();
      } catch {
        // ignore
      }
    });

    // 2. Dispatch a non-bubbling Escape directly on the menu panel element itself
    // so the menu's internal key manager can close it without bubbling to `document`
    // (which would falsely close active modals).
    const menuPanels = document.querySelectorAll<HTMLElement>(
      '.cdk-overlay-container .mat-mdc-menu-panel, .cdk-overlay-container .mat-menu-panel, .mat-mdc-menu-panel',
    );
    menuPanels.forEach((panel) => {
      try {
        panel.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            which: 27,
            bubbles: false,
            cancelable: true,
          }),
        );
        panel.click();
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
}
