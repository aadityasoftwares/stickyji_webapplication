import { TestBed } from '@angular/core/testing';
import { StickyMarkdownRendererComponent } from './sticky-markdown-renderer.component';
describe('StickyMarkdownRendererComponent', () => {
  it('renders safe formatted text without an editor and reacts to changed values', async () => {
    const fixture = TestBed.createComponent(StickyMarkdownRendererComponent);
    fixture.componentRef.setInput(
      'markdown',
      '**bold** =={pink:soft}pink== [safe](https://example.com) <img src=x onerror=alert(1)>',
    );
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('strong')?.textContent).toBe('bold');
    expect(root.querySelector('mark')?.dataset['color']).toBe('pink');
    expect(root.querySelector('mark')?.dataset['style']).toBe('soft');
    expect(root.querySelector('a')?.rel).toBe('noopener noreferrer');
    expect(root.querySelector('img,[contenteditable]')).toBeNull();
    fixture.componentRef.setInput('config', { allowLinks: false, maxLines: 2 });
    await fixture.whenStable();
    expect(root.querySelector('a')).toBeNull();
    fixture.componentRef.setInput('markdown', '');
    await fixture.whenStable();
    expect(root.textContent).toBe('');
  });
});
