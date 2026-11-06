/**
 * Closes all active Angular Material menus / CDK overlay menus.
 * Called whenever a modal, delete-confirm dialog, side panel, or sidebar opens.
 */
export function closeAllMatMenus(): void {
  if (typeof document === 'undefined') return;

  const triggerClose = () => {
    try {
      // 1. Dispatch Escape on document & window (CDK OverlayKeyboardDispatcher listens on document)
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(escapeEvent);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(escapeEvent);
      }

      // 2. Click & pointerdown on all CDK overlay backdrops
      const backdrops = document.querySelectorAll<HTMLElement>(
        '.cdk-overlay-container .cdk-overlay-backdrop, .cdk-overlay-backdrop, .cdk-overlay-backdrop-showing, .cdk-overlay-transparent-backdrop',
      );
      backdrops.forEach((backdrop) => {
        try {
          backdrop.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
          backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          backdrop.click();
        } catch {
          // ignore
        }
      });

      // 3. Dispatch Escape and click on any open menu panels
      const menuPanels = document.querySelectorAll<HTMLElement>(
        '.cdk-overlay-container .mat-mdc-menu-panel, .mat-mdc-menu-panel, [role="menu"]',
      );
      menuPanels.forEach((panel) => {
        try {
          panel.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: 'Escape',
              code: 'Escape',
              keyCode: 27,
              which: 27,
              bubbles: true,
              cancelable: true,
            }),
          );
          panel.click();
        } catch {
          // ignore
        }
      });

      // 4. Dispatch outside pointer events on document and body
      const outsideClick = new MouseEvent('click', { bubbles: true, cancelable: true });
      document.dispatchEvent(outsideClick);
      document.body?.dispatchEvent(outsideClick);
    } catch {
      // ignore
    }
  };

  // Run synchronously
  triggerClose();

  // Run in next tick as well to handle any microtasks or animations
  if (typeof setTimeout !== 'undefined') {
    setTimeout(triggerClose, 0);
  }
}
