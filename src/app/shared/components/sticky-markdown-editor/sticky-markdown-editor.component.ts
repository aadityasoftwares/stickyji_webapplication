import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
  forwardRef,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import {
  StickyCommand,
  StickyMarkdownToolbarComponent,
} from './toolbar/sticky-markdown-toolbar.component';
import { StickyHighlightPickerComponent } from './popovers/sticky-highlight-picker.component';
import { StickyLinkPopoverComponent } from './popovers/sticky-link-popover.component';
import {
  StickyMarkdownDocument,
  StickyMarkdownEditorMode,
  StickyMarks,
  StickySelection,
  blockText,
  documentText,
  sameMarks,
} from '../../utils/sticky-markdown/markdown.types';
import { parseStickyMarkdown } from '../../utils/sticky-markdown/markdown-parser';
import { serializeStickyMarkdown } from '../../utils/sticky-markdown/markdown-serializer';
import {
  patchStickyDocument,
  readStickyDom,
  renderStickyDocument,
} from '../../utils/sticky-markdown/markdown-dom';
import {
  captureStickySelection,
  restoreStickySelection,
} from '../../utils/sticky-markdown/markdown-selection';
import {
  StickyMarkdownHistory,
  StickySnapshot,
} from '../../utils/sticky-markdown/markdown-history';
import {
  formatSelection,
  locate,
  marksAt,
  replaceSelection,
  selectedRuns,
  sliceRuns,
  toggleList,
} from '../../utils/sticky-markdown/markdown-formatting';
import {
  plainStickyDocument,
  readStickyClipboard,
} from '../../utils/sticky-markdown/markdown-clipboard';
import { validateStickyMarkdown } from '../../utils/sticky-markdown/markdown-validator';

@Component({
  selector: 'app-sticky-markdown-editor',
  standalone: true,
  imports: [
    A11yModule,
    StickyMarkdownToolbarComponent,
    StickyHighlightPickerComponent,
    StickyLinkPopoverComponent,
  ],
  templateUrl: './sticky-markdown-editor.component.html',
  styleUrl: './sticky-markdown-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StickyMarkdownEditorComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => StickyMarkdownEditorComponent),
      multi: true,
    },
  ],
})
export class StickyMarkdownEditorComponent
  implements ControlValueAccessor, Validator, AfterViewInit, OnChanges, OnDestroy
{
  private static nextId = 0;
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  @ViewChild('surface', { static: true }) surface!: ElementRef<HTMLElement>;
  @ViewChild('popoverPanel') popoverElement?: ElementRef<HTMLElement>;
  @ViewChild('floatingToolbar', { read: ElementRef }) set floatingToolbar(
    ref: ElementRef<HTMLElement> | undefined,
  ) {
    if (ref && this.toolbar === 'selection')
      queueMicrotask(() => {
        if (
          !this.destroyed &&
          ref.nativeElement.isConnected &&
          typeof ref.nativeElement.showPopover === 'function'
        )
          ref.nativeElement.showPopover();
      });
  }
  @Input() mode: StickyMarkdownEditorMode = 'MULTI_LINE';
  @Input() plainMultiline = false;
  @Input() toolbar: 'selection' | 'focus' | 'always' | 'hidden' = 'focus';
  @Input() inputId = `sticky-markdown-${++StickyMarkdownEditorComponent.nextId}`;
  @Input() label = 'Note text';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() maxMarkdownLength = 100_000;
  @Input() maxVisibleCharacters?: number;
  @Input() maxWords?: number;
  @Input() showSource = false;
  @Input() enterBehavior: 'emit' | 'blur' = 'emit';
  @Input() set value(value: string | null | undefined) {
    this.writeValue(value);
  }
  get value(): string {
    return this.markdown;
  }
  @Output() valueChange = new EventEmitter<string>();
  @Output() enterKey = new EventEmitter<KeyboardEvent>();
  @Output() limitReached = new EventEmitter<string>();
  readonly history = new StickyMarkdownHistory();
  doc: StickyMarkdownDocument = plainStickyDocument('');
  markdown = '';
  selection: StickySelection = { start: 0, end: 0 };
  activeMarks: StickyMarks = {};
  pendingMarks: StickyMarks | null = null;
  focused = false;
  sourceVisible = false;
  error = '';
  popover: 'highlight' | 'link' | null = null;
  linkLabel = '';
  linkUrl = '';
  floatingLeft = 0;
  floatingTop = 0;
  floatingWidth = 340;
  private formDisabled = false;
  private composing = false;
  private compositionBefore: StickySnapshot | null = null;
  private inputBefore: StickySnapshot | null = null;
  private ready = false;
  private destroyed = false;
  private onChange: (value: string) => void = () => {};
  private onTouched = () => {};
  private onValidatorChange = () => {};
  private readonly selectionListener = () => this.refreshSelection();
  private readonly scrollListener = () => {
    if (this.popover) this.closePopover(false);
    if (this.toolbar === 'selection') {
      this.positionFloating();
      this.cdr.markForCheck();
    }
  };
  get isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }
  get isMultiline(): boolean {
    return this.mode === 'MULTI_LINE' || (this.mode === 'PLAIN' && this.plainMultiline);
  }
  get editable(): boolean {
    return !this.isDisabled && !this.readonly;
  }
  get empty(): boolean {
    return !documentText(this.doc);
  }
  get activeList(): string {
    return this.doc.blocks[locate(this.doc, this.selection.start).index]?.type ?? '';
  }
  get toolbarVisible(): boolean {
    return (
      this.mode !== 'PLAIN' &&
      !this.sourceVisible &&
      this.toolbar !== 'hidden' &&
      (this.toolbar === 'always' ||
        (this.focused &&
          (this.toolbar === 'focus' ||
            this.selection.start !== this.selection.end ||
            !!this.popover)))
    );
  }
  ngAfterViewInit(): void {
    this.ready = true;
    this.render();
    this.surface.nativeElement.ownerDocument.addEventListener(
      'selectionchange',
      this.selectionListener,
    );
    this.surface.nativeElement.ownerDocument.addEventListener('scroll', this.scrollListener, true);
  }
  ngOnChanges(): void {
    this.onValidatorChange();
    if (this.ready && !this.editable) this.closePopover(false);
  }
  ngOnDestroy(): void {
    this.destroyed = true;
    this.surface.nativeElement.ownerDocument.removeEventListener(
      'selectionchange',
      this.selectionListener,
    );
    this.surface.nativeElement.ownerDocument.removeEventListener(
      'scroll',
      this.scrollListener,
      true,
    );
  }
  writeValue(value: unknown): void {
    const text = String(value ?? '');
    if (text === this.markdown) return; // Preserve native caret on parent echo.
    this.markdown = text;
    this.doc = this.mode === 'PLAIN' ? plainStickyDocument(text) : parseStickyMarkdown(text);
    this.history.reset();
    this.pendingMarks = null;
    this.selection = { start: 0, end: 0 };
    this.error = '';
    if (this.ready) this.render();
    this.cdr.markForCheck();
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formDisabled = disabled;
    this.cdr.markForCheck();
  }
  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }
  validate(_control: AbstractControl): ValidationErrors | null {
    const message = validateStickyMarkdown(this.markdown, this.doc, this);
    return message ? { stickyMarkdown: { message } } : null;
  }
  focus(position: 'start' | 'end' | 'all' = 'end'): void {
    if (!this.editable) return;
    const end = documentText(this.doc).length;
    this.selection = { start: position === 'end' ? end : 0, end: position === 'start' ? 0 : end };
    this.restore();
  }
  private snapshot(): StickySnapshot {
    return { markdown: this.markdown, doc: this.doc, selection: { ...this.selection } };
  }
  private render(): void {
    renderStickyDocument(this.surface.nativeElement, this.doc, true, true);
  }
  private restore(): void {
    this.surface.nativeElement.focus({ preventScroll: true });
    restoreStickySelection(this.surface.nativeElement, this.selection);
  }
  private commit(
    doc: StickyMarkdownDocument,
    selection: StickySelection,
    kind = 'command',
    before = this.snapshot(),
    render = true,
  ): boolean {
    if (!this.editable) return false;
    const markdown = this.mode === 'PLAIN' ? documentText(doc) : serializeStickyMarkdown(doc);
    const error = validateStickyMarkdown(markdown, doc, { ...this, required: false });
    if (error) {
      this.error = error;
      this.limitReached.emit(error);
      this.doc = before.doc;
      this.selection = before.selection;
      this.render();
      this.restore();
      this.cdr.markForCheck();
      return false;
    }
    if (markdown !== this.markdown) this.history.record(before, kind);
    this.doc = doc;
    this.selection = selection;
    this.error = '';
    const changed = markdown !== this.markdown;
    this.markdown = markdown;
    if (render) {
      patchStickyDocument(this.surface.nativeElement, before.doc, doc);
      this.restore();
    }
    if (changed) {
      this.onChange(markdown);
      this.valueChange.emit(markdown);
      this.onValidatorChange();
    }
    this.updateActiveMarks();
    this.cdr.markForCheck();
    return true;
  }
  refreshSelection(): void {
    if (!this.ready || this.composing) return;
    const selection = captureStickySelection(this.surface.nativeElement);
    if (!selection) return;
    if (selection.start !== this.selection.start || selection.end !== this.selection.end) {
      this.pendingMarks = null;
      this.history.breakGroup();
    }
    this.selection = selection;
    this.updateActiveMarks();
    this.positionFloating();
    this.cdr.markForCheck();
  }
  private updateActiveMarks(): void {
    if (this.pendingMarks) {
      this.activeMarks = { ...this.pendingMarks };
      return;
    }
    const runs = selectedRuns(this.doc, this.selection);
    this.activeMarks = runs.length ? { ...runs[0].marks } : marksAt(this.doc, this.selection.start);
    for (const key of Object.keys(this.activeMarks) as (keyof StickyMarks)[]) {
      if (
        runs.some((run) => !sameMarks({ [key]: run.marks[key] }, { [key]: this.activeMarks[key] }))
      )
        delete this.activeMarks[key];
    }
  }
  onFocus(): void {
    this.focused = true;
    this.cdr.markForCheck();
  }
  onFocusOut(event: FocusEvent): void {
    if (this.host.nativeElement.contains(event.relatedTarget as Node | null)) return;
    this.focused = false;
    this.history.breakGroup();
    this.onTouched();
    this.cdr.markForCheck();
  }
  beforeInput(event: InputEvent): void {
    if (!this.editable) {
      event.preventDefault();
      return;
    }
    if (this.composing || event.isComposing) return;
    this.refreshSelection();
    this.inputBefore = this.snapshot();
    if (event.inputType === 'historyUndo' || event.inputType === 'historyRedo') {
      event.preventDefault();
      this.command(event.inputType === 'historyUndo' ? 'undo' : 'redo');
      return;
    }
    const formats: Record<string, StickyCommand> = {
      formatBold: 'bold',
      formatItalic: 'italic',
      formatUnderline: 'underline',
      formatStrikeThrough: 'strike',
    };
    if (formats[event.inputType]) {
      event.preventDefault();
      this.command(formats[event.inputType]);
      return;
    }
    if (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak') {
      event.preventDefault();
      if (this.isMultiline) this.insertBreak();
      else
        this.surface.nativeElement.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
        );
      return;
    }
    if (event.inputType === 'insertText' && this.pendingMarks && event.data) {
      event.preventDefault();
      this.insertDocument(
        {
          blocks: [
            {
              type: this.doc.blocks[locate(this.doc, this.selection.start).index].type,
              runs: [{ text: event.data, marks: this.pendingMarks }],
            },
          ],
        },
        'typing',
      );
    }
    if (event.inputType === 'insertFromDrop') event.preventDefault();
  }
  onInput(): void {
    if (this.composing) return;
    const before = this.inputBefore ?? this.snapshot();
    this.inputBefore = null;
    let doc: StickyMarkdownDocument;
    try {
      doc = readStickyDom(this.surface.nativeElement);
    } catch {
      this.doc = before.doc;
      this.selection = before.selection;
      this.error = 'This note has too many formatting sections.';
      this.render();
      this.restore();
      this.limitReached.emit(this.error);
      return;
    }
    if (!this.isMultiline) doc = this.singleLine(doc);
    if (this.mode === 'PLAIN') doc = plainStickyDocument(documentText(doc));
    const selection = captureStickySelection(this.surface.nativeElement) ?? this.selection;
    if (this.pendingMarks) {
      const insertedLength =
        documentText(doc).length -
        documentText(before.doc).length +
        before.selection.end -
        before.selection.start;
      if (insertedLength > 0)
        doc = formatSelection(
          doc,
          { start: before.selection.start, end: before.selection.start + insertedLength },
          () => ({ ...this.pendingMarks }),
        );
    }
    // Ordinary native typing leaves its DOM and caret intact; only structural changes normalize DOM.
    const structural =
      !!this.pendingMarks ||
      this.surface.nativeElement.querySelectorAll('[data-sticky-block]').length !==
        doc.blocks.length;
    this.commit(doc, selection, 'typing', before, structural);
  }
  compositionStart(): void {
    this.refreshSelection();
    this.compositionBefore = this.snapshot();
    this.composing = true;
  }
  compositionEnd(): void {
    this.composing = false;
    this.inputBefore = this.compositionBefore;
    this.compositionBefore = null;
    this.onInput();
  }
  onKeydown(event: KeyboardEvent): void {
    if (this.composing || event.isComposing) return;
    if (event.key === 'Escape' && this.popover) {
      event.preventDefault();
      event.stopPropagation();
      this.closePopover();
      return;
    }
    if (!this.editable) return;
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      const command: StickyCommand | undefined =
        key === 'z'
          ? event.shiftKey
            ? 'redo'
            : 'undo'
          : key === 'y'
            ? 'redo'
            : (
                { b: 'bold', i: 'italic', u: 'underline', k: 'link' } as Record<
                  string,
                  StickyCommand
                >
              )[key];
      if (command) {
        event.preventDefault();
        event.stopPropagation();
        this.command(command);
        return;
      }
    }
    if (event.key === 'Enter') {
      if (this.isMultiline && (event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      event.stopPropagation();
      this.refreshSelection();
      if (this.isMultiline) this.insertBreak();
      else {
        this.enterKey.emit(event);
        if (this.enterBehavior === 'blur') this.surface.nativeElement.blur();
      }
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      this.pendingMarks = null;
      this.history.breakGroup();
      if (this.isMultiline) event.stopPropagation();
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      this.refreshSelection();
      const at = locate(this.doc, this.selection.start),
        block = this.doc.blocks[at.index];
      const boundary =
        event.key === 'Backspace' ? at.offset === 0 : at.offset === blockText(block).length;
      if (this.selection.start !== this.selection.end || boundary) {
        event.preventDefault();
        if (
          this.selection.start === this.selection.end &&
          event.key === 'Backspace' &&
          at.offset === 0 &&
          block.type !== 'paragraph'
        ) {
          this.commit(
            {
              blocks: this.doc.blocks.map((b, i) =>
                i === at.index ? { ...b, type: 'paragraph' } : b,
              ),
            },
            this.selection,
          );
        } else {
          const selection =
            this.selection.start === this.selection.end
              ? {
                  start: Math.max(0, this.selection.start - (event.key === 'Backspace' ? 1 : 0)),
                  end: Math.min(
                    documentText(this.doc).length,
                    this.selection.end + (event.key === 'Delete' ? 1 : 0),
                  ),
                }
              : this.selection;
          this.commit(replaceSelection(this.doc, selection, plainStickyDocument('')), {
            start: selection.start,
            end: selection.start,
          });
        }
      }
    }
  }
  private insertBreak(): void {
    const at = locate(this.doc, this.selection.start),
      block = this.doc.blocks[at.index];
    if (!blockText(block) && block.type !== 'paragraph') {
      this.commit(
        {
          blocks: this.doc.blocks.map((b, i) => (i === at.index ? { ...b, type: 'paragraph' } : b)),
        },
        this.selection,
      );
    } else
      this.insertDocument({
        blocks: [
          { type: block.type, runs: [] },
          { type: block.type, runs: [] },
        ],
      });
  }
  private singleLine(doc: StickyMarkdownDocument): StickyMarkdownDocument {
    return {
      blocks: [
        {
          type: 'paragraph',
          runs: doc.blocks.flatMap((block, i) => [
            ...(i ? [{ text: ' ', marks: {} }] : []),
            ...block.runs,
          ]),
        },
      ],
    };
  }
  insertDocument(inserted: StickyMarkdownDocument, kind = 'command'): void {
    if (!this.isMultiline) inserted = this.singleLine(inserted);
    if (this.mode === 'PLAIN') inserted = plainStickyDocument(documentText(inserted));
    const end = this.selection.start + documentText(inserted).length;
    this.commit(replaceSelection(this.doc, this.selection, inserted), { start: end, end }, kind);
  }
  command(command: StickyCommand): void {
    if (!this.editable || this.composing) return;
    this.refreshSelection();
    if (command === 'undo' || command === 'redo') {
      const next = this.history[command](this.snapshot());
      if (next) {
        this.markdown = next.markdown;
        this.doc = next.doc;
        this.selection = next.selection;
        this.pendingMarks = null;
        this.error = '';
        this.render();
        this.restore();
        this.onChange(this.markdown);
        this.valueChange.emit(this.markdown);
        this.onValidatorChange();
        this.updateActiveMarks();
      }
      return;
    }
    if (this.mode === 'PLAIN') return;
    if (command === 'highlight' || command === 'link') {
      this.openPopover(command);
      return;
    }
    if (command === 'bullet' || command === 'number') {
      if (this.mode === 'MULTI_LINE')
        this.commit(toggleList(this.doc, this.selection, command), this.selection);
      return;
    }
    if (command === 'clear') {
      this.applyMarks(() => ({}));
      return;
    }
    const enabled = !this.activeMarks[command];
    this.applyMarks((marks) => {
      const next = { ...marks };
      if (enabled) next[command] = true;
      else delete next[command];
      return next;
    });
  }
  private applyMarks(change: (marks: StickyMarks) => StickyMarks): void {
    if (!this.editable) return;
    if (this.selection.start === this.selection.end) {
      this.pendingMarks = change(this.pendingMarks ?? marksAt(this.doc, this.selection.start));
      this.activeMarks = { ...this.pendingMarks };
      this.restore();
    } else this.commit(formatSelection(this.doc, this.selection, change), this.selection);
  }
  applyHighlight(highlight: StickyMarks['highlight']): void {
    this.closePopover(false);
    this.applyMarks((marks) => {
      const next = { ...marks };
      if (highlight) next.highlight = highlight;
      else delete next.highlight;
      return next;
    });
  }
  private openPopover(kind: 'highlight' | 'link'): void {
    if (kind === 'link') {
      const link = marksAt(this.doc, this.selection.start).link;
      if (this.selection.start === this.selection.end && link) {
        const at = locate(this.doc, this.selection.start),
          block = this.doc.blocks[at.index];
        let offset = this.selection.start - at.offset;
        for (const run of block.runs) {
          const end = offset + run.text.length;
          if (
            run.marks.link === link &&
            end >= this.selection.start &&
            offset <= this.selection.end
          ) {
            this.selection = {
              start: Math.min(offset, this.selection.start),
              end: Math.max(end, this.selection.end),
            };
          }
          offset = end;
        }
      }
      this.linkLabel = documentText(this.doc).slice(this.selection.start, this.selection.end);
      this.linkUrl = link ?? '';
    }
    this.popover = kind;
    this.focused = true;
    this.cdr.detectChanges();
    const element = this.popoverElement?.nativeElement;
    if (element) {
      if (typeof element.showPopover === 'function') element.showPopover();
      this.positionPopover(element);
      queueMicrotask(() => {
        if (!this.destroyed) element.querySelector<HTMLElement>('input, button')?.focus();
      });
    }
  }
  applyLink(value: { label: string; url: string }): void {
    this.closePopover(false);
    if (value.label === documentText(this.doc).slice(this.selection.start, this.selection.end))
      this.applyMarks((marks) => ({ ...marks, link: value.url }));
    else
      this.insertDocument({
        blocks: [
          {
            type: 'paragraph',
            runs: [
              {
                text: value.label,
                marks: { ...marksAt(this.doc, this.selection.start), link: value.url },
              },
            ],
          },
        ],
      });
  }
  removeLink(): void {
    this.closePopover(false);
    this.applyMarks((marks) => {
      const next = { ...marks };
      delete next.link;
      return next;
    });
  }
  closePopover(restore = true): void {
    const element = this.popoverElement?.nativeElement;
    if (element && typeof element.hidePopover === 'function') element.hidePopover();
    this.popover = null;
    if (restore && this.ready) this.restore();
    this.cdr.markForCheck();
  }
  private panelBounds(): DOMRect {
    return (
      this.host.nativeElement.closest('.app-side-panel') ?? this.host.nativeElement
    ).getBoundingClientRect();
  }
  private positionFloating(): void {
    if (!this.ready || this.toolbar !== 'selection') return;
    const selection = this.surface.nativeElement.ownerDocument.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const rect =
      range && typeof range.getBoundingClientRect === 'function'
        ? range.getBoundingClientRect()
        : this.surface.nativeElement.getBoundingClientRect();
    const bounds = this.panelBounds();
    this.floatingWidth = Math.min(340, Math.max(180, bounds.width - 24));
    this.floatingLeft = Math.max(
      bounds.left + 8,
      Math.min(rect.left, bounds.right - this.floatingWidth - 8),
    );
    this.floatingTop = Math.max(
      8,
      bounds.top + 4,
      Math.min(rect.top - 42, window.innerHeight - 80),
    );
  }
  private positionPopover(element: HTMLElement): void {
    const rect = this.surface.nativeElement.getBoundingClientRect(),
      bounds = this.panelBounds();
    const width = Math.min(290, Math.max(180, bounds.width - 24));
    element.style.width = `${width}px`;
    element.style.left = `${Math.max(8, bounds.left + 8, Math.min(rect.left, bounds.right - width - 8))}px`;
    const height = element.getBoundingClientRect().height || 190;
    element.style.top = `${Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - height - 12))}px`;
  }
  @HostListener('document:pointerdown', ['$event']) outsideClick(event: PointerEvent): void {
    if (this.popover && !this.host.nativeElement.contains(event.target as Node))
      this.closePopover(false);
  }
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    if (!this.editable) return;
    this.refreshSelection();
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (text.length > this.maxMarkdownLength) {
      this.error = `Pasted text exceeds ${this.maxMarkdownLength} stored characters.`;
      this.limitReached.emit(this.error);
      return;
    }
    this.insertDocument(
      readStickyClipboard(
        text,
        this.mode === 'PLAIN' ? '' : event.clipboardData?.getData('text/html'),
      ),
    );
  }
  onCopy(event: ClipboardEvent, cut = false): void {
    this.refreshSelection();
    if (this.selection.start === this.selection.end || !event.clipboardData) return;
    event.preventDefault();
    const start = locate(this.doc, this.selection.start),
      end = locate(this.doc, this.selection.end);
    const doc: StickyMarkdownDocument = {
      blocks: this.doc.blocks
        .slice(start.index, end.index + 1)
        .map((block, i) => ({
          ...block,
          runs: sliceRuns(
            block.runs,
            i === 0 ? start.offset : 0,
            i === end.index - start.index ? end.offset : Infinity,
          ),
        })),
    };
    const container = this.surface.nativeElement.ownerDocument.createElement('div');
    renderStickyDocument(container, doc);
    event.clipboardData.setData('text/plain', documentText(doc));
    // Reading generated safe HTML for clipboard export; never assigning untrusted innerHTML.
    event.clipboardData.setData('text/html', container.innerHTML);
    if (cut && this.editable) this.insertDocument(plainStickyDocument(''));
  }
  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (this.editable && event.dataTransfer) {
      this.refreshSelection();
      this.insertDocument(plainStickyDocument(event.dataTransfer.getData('text/plain')));
    }
  }
  preventLinkNavigation(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('a')) event.preventDefault();
  }
  toggleSource(): void {
    this.sourceVisible = !this.sourceVisible;
    this.closePopover(false);
  }
  sourceInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    if (!this.editable) {
      input.value = this.markdown;
      return;
    }
    if (!this.isMultiline && /[\r\n]/.test(input.value)) {
      this.error = 'This field only supports one line.';
      input.value = this.markdown;
      return;
    }
    const doc =
      this.mode === 'PLAIN' ? plainStickyDocument(input.value) : parseStickyMarkdown(input.value);
    const error = validateStickyMarkdown(input.value, doc, { ...this, required: false });
    if (error) {
      this.error = error;
      input.value = this.markdown;
      return;
    }
    const before = this.snapshot();
    this.history.record(before, 'source');
    this.markdown = input.value;
    this.doc = doc;
    this.render();
    this.error = '';
    this.onChange(this.markdown);
    this.valueChange.emit(this.markdown);
    this.onValidatorChange();
  }
}
