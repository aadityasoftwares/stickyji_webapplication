import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { parseStickyMarkdown } from '../../utils/sticky-markdown/markdown-parser';
import { renderStickyDocument } from '../../utils/sticky-markdown/markdown-dom';
import { StickyMarkdownRendererConfig } from '../../utils/sticky-markdown/markdown.types';

@Component({
  selector: 'app-sticky-markdown-renderer',
  standalone: true,
  template: `<span
    #surface
    class="sticky-markdown-content sticky-markdown-renderer"
    [class.is-compact]="config.compact"
    [class.is-clamped]="!!config.maxLines"
    [class.collapse-breaks]="config.preserveLineBreaks === false"
    [style.-webkit-line-clamp]="config.maxLines || null"
    (click)="onClick($event)"
  ></span>`,
  styleUrl: './sticky-markdown-renderer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class StickyMarkdownRendererComponent implements OnChanges, AfterViewInit {
  @Input() markdown = '';
  @Input() config: StickyMarkdownRendererConfig = {};
  @ViewChild('surface', { static: true }) surface!: ElementRef<HTMLElement>;
  ngOnChanges(): void {
    this.render();
  }
  ngAfterViewInit(): void {
    this.render();
  }
  private render(): void {
    if (this.surface)
      renderStickyDocument(
        this.surface.nativeElement,
        parseStickyMarkdown(this.markdown),
        this.config.allowLinks !== false,
      );
  }
  onClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('a')) event.stopPropagation();
  }
}
