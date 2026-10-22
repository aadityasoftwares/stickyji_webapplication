import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StickyMarkdownEditorComponent } from '../../shared/components/sticky-markdown-editor/sticky-markdown-editor.component';
import { StickyMarkdownRendererComponent } from '../../shared/components/sticky-markdown-renderer/sticky-markdown-renderer.component';
@Component({
  selector: 'app-markdown-editor-showcase',
  standalone: true,
  imports: [FormsModule, StickyMarkdownEditorComponent, StickyMarkdownRendererComponent],
  template: `<h1>Sticky Markdown Editor</h1>
    <p>Visual editing with Markdown string form values.</p>
    <section>
      <h2>Title</h2>
      <app-sticky-markdown-editor
        label="Example title"
        mode="SINGLE_LINE"
        [(ngModel)]="title"
        [maxMarkdownLength]="200"
        [showSource]="true"
      />
    </section>
    <section>
      <h2>Details</h2>
      <app-sticky-markdown-editor
        label="Example details"
        mode="MULTI_LINE"
        [(ngModel)]="content"
        [maxMarkdownLength]="10000"
        [showSource]="true"
      />
    </section>
    <section class="preview">
      <h2>Saved content preview</h2>
      <app-sticky-markdown-renderer [markdown]="title" /><app-sticky-markdown-renderer
        [markdown]="content"
      />
    </section>
    <section>
      <h2>Checklist item</h2>
      <app-sticky-markdown-editor
        label="Example checklist item"
        mode="CHECKLIST_ITEM"
        [(ngModel)]="item"
        [maxMarkdownLength]="300"
        toolbar="selection"
      />
    </section>
    <section>
      <h2>Plain text</h2>
      <app-sticky-markdown-editor label="Example plain text" mode="PLAIN" [(ngModel)]="plain" />
    </section>`,
  styles: [
    `
      :host {
        display: block;
        max-width: 580px;
        margin: 24px auto;
        padding: 16px;
      }
      h1 {
        font-size: 24px;
      }
      h2 {
        font-size: 16px;
      }
      section {
        margin-top: 22px;
      }
      .preview {
        padding: 18px;
        background: #fff0a8;
        border-radius: 9px;
      }
    `,
  ],
})
export class MarkdownEditorShowcase {
  title = 'Review **launch** tasks';
  content =
    'Complete =={green:soft}important== tasks and check [documentation](https://example.com).\n\n- Review pricing\n- Test checkout\n- Publish website';
  item = 'Check **everything**';
  plain = 'Plain text, including **literal punctuation**';
}
