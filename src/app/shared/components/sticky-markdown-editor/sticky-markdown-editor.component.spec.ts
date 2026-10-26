import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { StickyMarkdownEditorComponent } from './sticky-markdown-editor.component';
import {
  restoreStickySelection,
  captureStickySelection,
} from '../../utils/sticky-markdown/markdown-selection';
import { plainStickyDocument } from '../../utils/sticky-markdown/markdown-clipboard';

@Component({
  standalone: true,
  imports: [StickyMarkdownEditorComponent, ReactiveFormsModule],
  template: '<app-sticky-markdown-editor [formControl]="control" mode="MULTI_LINE" />',
})
class FormHost {
  control = new FormControl('**Existing**');
}

describe('StickyMarkdownEditorComponent', () => {
  let fixture: ComponentFixture<StickyMarkdownEditorComponent>;
  let editor: StickyMarkdownEditorComponent;
  const select = (start: number, end = start) => {
    restoreStickySelection(editor.surface.nativeElement, { start, end });
    editor.refreshSelection();
  };
  beforeEach(async () => {
    fixture = TestBed.createComponent(StickyMarkdownEditorComponent);
    editor = fixture.componentInstance;
    await fixture.whenStable();
  });
  it('uses a Markdown string CVA, supports form reset and disabled state', async () => {
    const host = TestBed.createComponent(FormHost);
    await host.whenStable();
    const surface: HTMLElement = host.nativeElement.querySelector('[contenteditable]');
    expect(surface.querySelector('strong')?.textContent).toBe('Existing');
    host.componentInstance.control.disable();
    await host.whenStable();
    expect(surface.getAttribute('contenteditable')).toBe('false');
    host.componentInstance.control.enable();
    host.componentInstance.control.reset('');
    await host.whenStable();
    expect(surface.textContent).toBe('');
  });
  it('applies partial formatting, preserves selection and undoes/redoes it', () => {
    editor.writeValue('hello world');
    select(6, 11);
    editor.command('bold');
    expect(editor.markdown).toBe('hello **world**');
    expect(editor.surface.nativeElement.querySelector('strong')?.textContent).toBe('world');
    expect(captureStickySelection(editor.surface.nativeElement)).toMatchObject({
      start: 6,
      end: 11,
    });
    editor.command('undo');
    expect(editor.markdown).toBe('hello world');
    editor.command('redo');
    expect(editor.markdown).toBe('hello **world**');
  });
  const button = (label: string): HTMLButtonElement =>
    fixture.nativeElement.querySelector(`button[aria-label="${label}"]`);

  it.each([
    ['bold', 'Bold (Ctrl/Cmd+B)', '**text**'],
    ['italic', 'Italic (Ctrl/Cmd+I)', '*text*'],
    ['underline', 'Underline (Ctrl/Cmd+U)', '++text++'],
    ['strike', 'Strikethrough', '~~text~~'],
  ] as const)(
    'updates %s on the first click, toggle and native selection change',
    async (_, label, markdown) => {
      fixture.componentRef.setInput('toolbar', 'always');
      editor.writeValue('text plain');
      select(0, 4);
      await fixture.whenStable();
      button(label).click();
      await fixture.whenStable();
      expect(button(label).getAttribute('aria-pressed')).toBe('true');
      expect(editor.markdown).toBe(`${markdown} plain`);
      expect(captureStickySelection(editor.surface.nativeElement)).toMatchObject({
        start: 0,
        end: 4,
      });
      button(label).click();
      await fixture.whenStable();
      expect(button(label).getAttribute('aria-pressed')).toBe('false');
      editor.writeValue(`${markdown} plain`);
      for (const [start, end, active] of [
        [0, 4, true],
        [2, 2, true],
        [7, 7, false],
      ] as const) {
        restoreStickySelection(editor.surface.nativeElement, { start, end });
        document.dispatchEvent(new Event('selectionchange'));
        await fixture.whenStable();
        expect(button(label).getAttribute('aria-pressed')).toBe(String(active));
      }
    },
  );

  it('clears stale toolbar marks when the form replaces the document', async () => {
    fixture.componentRef.setInput('toolbar', 'always');
    editor.writeValue('**bold**');
    select(2);
    await fixture.whenStable();
    expect(button('Bold (Ctrl/Cmd+B)').getAttribute('aria-pressed')).toBe('true');
    editor.writeValue('plain');
    await fixture.whenStable();
    expect(button('Bold (Ctrl/Cmd+B)').getAttribute('aria-pressed')).toBe('false');
  });

  it('updates pending marks through typing, clear, shortcuts and caret movement', async () => {
    fixture.componentRef.setInput('toolbar', 'always');
    editor.writeValue('plain ');
    editor.surface.nativeElement.focus();
    select(6);
    await fixture.whenStable();
    const bold = button('Bold (Ctrl/Cmd+B)');
    const pointer = new MouseEvent('pointerdown', { bubbles: true, cancelable: true });
    bold.dispatchEvent(pointer);
    expect(pointer.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(editor.surface.nativeElement);
    bold.click();
    await fixture.whenStable();
    expect(bold.getAttribute('aria-pressed')).toBe('true');
    editor.surface.nativeElement.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: 'X',
        bubbles: true,
        cancelable: true,
      }),
    );
    await fixture.whenStable();
    expect(editor.markdown).toBe('plain **X**');
    expect(bold.getAttribute('aria-pressed')).toBe('true');
    button('Clear inline formatting').click();
    await fixture.whenStable();
    expect(bold.getAttribute('aria-pressed')).toBe('false');
    editor.surface.nativeElement.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    await fixture.whenStable();
    expect(bold.getAttribute('aria-pressed')).toBe('true');
    select(2);
    await fixture.whenStable();
    expect(bold.getAttribute('aria-pressed')).toBe('false');
  });

  it('synchronizes highlight, link, lists, clear, undo and redo with selection', async () => {
    fixture.componentRef.setInput('toolbar', 'always');
    editor.writeValue('text\nplain');
    select(0, 4);
    editor.applyHighlight({ color: 'green', style: 'soft' });
    editor.applyLink({ label: 'text', url: 'https://example.com/' });
    await fixture.whenStable();
    expect(button('Highlight').getAttribute('aria-pressed')).toBe('true');
    expect(button('Link (Ctrl/Cmd+K)').getAttribute('aria-pressed')).toBe('true');
    button('Bullet list').click();
    await fixture.whenStable();
    expect(button('Bullet list').getAttribute('aria-pressed')).toBe('true');
    select(0, 10);
    await fixture.whenStable();
    expect(button('Bullet list').getAttribute('aria-pressed')).toBe('false');
    expect(button('Highlight').getAttribute('aria-pressed')).toBe('false');
    expect(button('Link (Ctrl/Cmd+K)').getAttribute('aria-pressed')).toBe('false');
    select(0, 4);
    button('Numbered list').click();
    await fixture.whenStable();
    expect(button('Numbered list').getAttribute('aria-pressed')).toBe('true');
    expect(button('Bullet list').getAttribute('aria-pressed')).toBe('false');
    button('Clear inline formatting').click();
    await fixture.whenStable();
    expect(button('Highlight').getAttribute('aria-pressed')).toBe('false');
    expect(button('Link (Ctrl/Cmd+K)').getAttribute('aria-pressed')).toBe('false');
    button('Undo (Ctrl/Cmd+Z)').click();
    await fixture.whenStable();
    expect(button('Highlight').getAttribute('aria-pressed')).toBe('true');
    expect(button('Link (Ctrl/Cmd+K)').getAttribute('aria-pressed')).toBe('true');
    button('Redo (Ctrl/Cmd+Shift+Z)').click();
    await fixture.whenStable();
    expect(button('Highlight').getAttribute('aria-pressed')).toBe('false');
    expect(button('Link (Ctrl/Cmd+K)').getAttribute('aria-pressed')).toBe('false');
  });

  it('floats the focus toolbar without leaving a blank toolbar row', async () => {
    fixture.componentRef.setInput('showSource', true);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-sticky-markdown-toolbar')).toBeNull();
    editor.surface.nativeElement.focus();
    await fixture.whenStable();
    const toolbar = fixture.nativeElement.querySelector('app-sticky-markdown-toolbar');
    expect(toolbar.getAttribute('popover')).toBe('manual');
    expect(getComputedStyle(toolbar).position).toBe('fixed');
    editor.surface.nativeElement.blur();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-sticky-markdown-toolbar')).toBeNull();
    editor.surface.nativeElement.focus();
    await fixture.whenStable();
    editor.toggleSource();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-sticky-markdown-toolbar')).toBeNull();
  });

  it('allows upright note fonts to display italic and keeps single-line inputs scrollable horizontally', async () => {
    fixture.componentRef.setInput('mode', 'SINGLE_LINE');
    editor.writeValue('text');
    select(0, 4);
    editor.command('italic');
    await fixture.whenStable();
    const surface = editor.surface.nativeElement;
    const italic = surface.querySelector('em')!;
    expect(editor.markdown).toBe('*text*');
    expect(getComputedStyle(italic).fontStyle).toBe('italic');
    expect(getComputedStyle(surface).fontSynthesis).toBe('style');
    expect(getComputedStyle(surface).overflowY).toBe('hidden');
    expect(getComputedStyle(surface).overflowX).toBe('auto');
  });
  it('supports pending marks and removes them for subsequent typing', () => {
    editor.writeValue('hello ');
    select(6);
    editor.command('bold');
    editor.beforeInput(
      new InputEvent('beforeinput', { inputType: 'insertText', data: 'x', cancelable: true }),
    );
    expect(editor.markdown).toBe('hello **x**');
    editor.command('bold');
    editor.beforeInput(
      new InputEvent('beforeinput', { inputType: 'insertText', data: 'y', cancelable: true }),
    );
    expect(editor.markdown).toBe('hello **x**y');
  });
  it('switches/removes highlight without losing bold and can edit/remove links', () => {
    editor.writeValue('**hello**');
    select(0, 5);
    editor.applyHighlight({ color: 'green', style: 'soft' });
    expect(editor.markdown).toBe('**=={green:soft}hello==**');
    editor.applyHighlight(undefined);
    expect(editor.markdown).toBe('**hello**');
    editor.applyLink({ label: 'hello', url: 'https://example.com/' });
    expect(editor.markdown).toBe('[**hello**](https://example.com/)');
    editor.removeLink();
    expect(editor.markdown).toBe('**hello**');
  });
  it('splits lists and exits an empty item with Enter', () => {
    editor.writeValue('one');
    select(3);
    editor.command('number');
    editor.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(editor.markdown).toBe('1. one\n2. ');
    editor.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(editor.markdown).toBe('1. one\n');
  });
  it('rejects over-limit formatting and paste atomically without truncating text', () => {
    editor.maxMarkdownLength = 7;
    editor.writeValue('hello');
    select(0, 5);
    editor.command('bold');
    expect(editor.markdown).toBe('hello');
    expect(editor.error).toContain('stored characters');
    select(5);
    editor.insertDocument(plainStickyDocument('abcd'));
    expect(editor.markdown).toBe('hello');
    select(0, 5);
    editor.insertDocument(plainStickyDocument('short'));
    expect(editor.markdown).toBe('short');
  });
  it('keeps native nodes on ordinary input and does not emit on unchanged legacy load', () => {
    const change = vi.fn();
    editor.registerOnChange(change);
    editor.writeValue('C++');
    expect(change).not.toHaveBeenCalled();
    select(3);
    editor.beforeInput(new InputEvent('beforeinput', { inputType: 'insertText', data: '!' }));
    const text = editor.surface.nativeElement.querySelector('p')!.firstChild!;
    text.textContent = 'C++!';
    select(4);
    editor.onInput();
    expect(editor.surface.nativeElement.querySelector('p')!.firstChild).toBe(text);
    expect(change).toHaveBeenCalledWith('C\\+\\+!');
  });
  it('supports keyboard shortcuts, single-line Enter and plain mode', async () => {
    fixture.componentRef.setInput('mode', 'SINGLE_LINE');
    await fixture.whenStable();
    editor.writeValue('text');
    select(0, 4);
    editor.onKeydown(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }));
    expect(editor.markdown).toBe('**text**');
    const enter = vi.fn();
    editor.enterKey.subscribe(enter);
    editor.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(enter).toHaveBeenCalled();
    editor.insertDocument(plainStickyDocument('a\nb'));
    expect(editor.markdown).toBe('a b');
    fixture.componentRef.setInput('mode', 'PLAIN');
    await fixture.whenStable();
    editor.writeValue('**literal**');
    select(0, 11);
    editor.command('bold');
    expect(editor.markdown).toBe('**literal**');
  });
  it('defers IME updates until composition ends and rolls back over-limit composition', () => {
    editor.maxMarkdownLength = 4;
    editor.writeValue('abc');
    select(3);
    editor.compositionStart();
    editor.surface.nativeElement.querySelector('p')!.textContent = 'abc日本';
    editor.onInput();
    expect(editor.markdown).toBe('abc');
    editor.compositionEnd();
    expect(editor.markdown).toBe('abc');
    expect(editor.surface.nativeElement.textContent).toBe('abc');
  });
  it('preserves other paragraphs while typing with pending marks', () => {
    editor.writeValue('first\nsecond');
    select(5);
    const second = editor.surface.nativeElement.querySelectorAll('p')[1];
    editor.command('bold');
    editor.beforeInput(
      new InputEvent('beforeinput', { inputType: 'insertText', data: 'X', cancelable: true }),
    );
    expect(editor.surface.nativeElement.querySelectorAll('p')[1]).toBe(second);
    expect(editor.markdown).toBe('first**X**\nsecond');
  });
  it('applies pending formatting to committed IME text', () => {
    select(0);
    editor.command('bold');
    editor.compositionStart();
    editor.surface.nativeElement.querySelector('p')!.textContent = '日本';
    editor.compositionEnd();
    expect(editor.markdown).toBe('**日本**');
    expect(editor.surface.nativeElement.querySelector('strong')?.textContent).toBe('日本');
  });
  it('uses plain-text fallback for deeply nested clipboard HTML without silently dropping text', () => {
    const plain = 'keep all text';
    const data = {
      getData: (type: string) =>
        type === 'text/plain' ? plain : '<div>'.repeat(70) + plain + '</div>'.repeat(70),
    };
    editor.onPaste({ preventDefault() {}, clipboardData: data } as unknown as ClipboardEvent);
    expect(editor.markdown).toBe(plain);
  });
});
