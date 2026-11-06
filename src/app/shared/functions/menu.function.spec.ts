import { closeAllMatMenus } from './menu.function';

describe('closeAllMatMenus', () => {
  let overlayContainer: HTMLElement;

  beforeEach(() => {
    overlayContainer = document.createElement('div');
    overlayContainer.className = 'cdk-overlay-container';
    document.body.appendChild(overlayContainer);
  });

  afterEach(() => {
    overlayContainer.remove();
  });

  it('clicks all open CDK overlay backdrops', () => {
    const backdrop1 = document.createElement('div');
    backdrop1.className = 'cdk-overlay-backdrop';
    const clickSpy1 = vi.fn();
    backdrop1.addEventListener('click', clickSpy1);
    overlayContainer.appendChild(backdrop1);

    const backdrop2 = document.createElement('div');
    backdrop2.className = 'cdk-overlay-backdrop-showing';
    const clickSpy2 = vi.fn();
    backdrop2.addEventListener('click', clickSpy2);
    overlayContainer.appendChild(backdrop2);

    closeAllMatMenus();

    expect(clickSpy1).toHaveBeenCalled();
    expect(clickSpy2).toHaveBeenCalled();
  });

  it('dispatches Escape and click on mat-mdc-menu-panel elements', () => {
    const panel = document.createElement('div');
    panel.className = 'mat-mdc-menu-panel';
    const keydownSpy = vi.fn();
    const clickSpy = vi.fn();
    panel.addEventListener('keydown', keydownSpy);
    panel.addEventListener('click', clickSpy);
    overlayContainer.appendChild(panel);

    closeAllMatMenus();

    expect(keydownSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('runs safely when no overlays or menus exist', () => {
    expect(() => closeAllMatMenus()).not.toThrow();
  });
});
