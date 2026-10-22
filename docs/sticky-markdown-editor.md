# Sticky Ji Markdown Editor

The editor persists Markdown strings through the existing note `title` and `content` fields and checklist `title` fields. No dependencies, endpoints, database changes, or rich-text JSON properties were added. Internal documents never leave the frontend.

## Components and usage

```html
<app-sticky-markdown-editor
  mode="SINGLE_LINE"
  formControlName="title"
  label="Title"
  [maxMarkdownLength]="200"
/>
<app-sticky-markdown-editor
  mode="MULTI_LINE"
  formControlName="content"
  label="Details"
  [required]="true"
  [maxMarkdownLength]="10000"
/>
<app-sticky-markdown-renderer
  [markdown]="note.content"
  [config]="{compact: true, maxLines: 3, allowLinks: true, preserveLineBreaks: true}"
/>
```

Import the standalone components from `src/app/shared/components/sticky-markdown-editor/sticky-markdown-editor.component.ts` and `src/app/shared/components/sticky-markdown-renderer/sticky-markdown-renderer.component.ts`.

`StickyMarkdownEditorComponent` implements ControlValueAccessor and Validator. Reactive forms, ngModel, and `[value]`/`(valueChange)` bindings all carry strings. It supports disabled and readonly states, required text, maximum stored characters, maximum visible Unicode code points, and maximum whitespace-delimited words. Optional `showSource` exposes an editable Markdown source view; it is off in normal note flows.

| Mode | Behavior |
| --- | --- |
| `SINGLE_LINE` | Inline formatting; Enter emits `enterKey` or blurs according to `enterBehavior`; pasted lines become spaces. |
| `MULTI_LINE` | Inline formatting, paragraphs, flat bullet/numbered lists. |
| `CHECKLIST_ITEM` | Inline formatting; Enter delegates to the existing parent checklist handler. Completion is a separate field. |
| `PLAIN` | Literal text with formatting disabled; `plainMultiline` enables newlines. |

`toolbar` accepts `focus`, `selection`, `always`, or `hidden`. Focus is the default and is used by the note panel. Selection mode floats above the selected text. Formatting popups and floating toolbars use the native popover top layer in supporting browsers to escape scrolling/overflow containers; coordinates are constrained to the panel and viewport. Toolbar arrow/Home/End navigation, labeled buttons, keyboard shortcuts, focus trapping in popups, and Escape dismissal are included.

`StickyMarkdownToolbarComponent`, `StickyHighlightPickerComponent`, and `StickyLinkPopoverComponent` are separate reusable components. The toolbar supports bold, italic, underline, strikethrough, highlights, links, lists, undo, redo, and clear inline formatting. Keyboard shortcuts are Ctrl/Cmd+B/I/U/K/Z, Ctrl/Cmd+Shift+Z, and Ctrl+Y. Clear formatting retains list membership. Enter and Shift+Enter create a new block; Enter on an empty list item exits the list. Nested lists and distinct soft-break nodes are intentionally outside this grammar.

The developer showcase is `/showcase/markdown-editor`, including all four modes, source inspection, and a saved-content preview.

## Deterministic grammar

This is a Sticky Ji subset, not CommonMark. It supports:

| Feature | Source |
| --- | --- |
| Bold | `**text**` |
| Italic | `*text*` |
| Underline | `++text++` |
| Strikethrough | `~~text~~` |
| Yellow marker | `==text==` |
| Named marker | `=={green}text==` |
| Explicit style | `=={green:soft}text==` or `=={green:marker}text==` |
| Link | `[label](https://example.com)` |
| Bullet item | `- Item` at column zero |
| Numbered item | `1. Item` at column zero |

- Each newline represents one block boundary. Empty lines remain empty paragraphs. CRLF/CR are normalized to LF when parsing.
- Inline delimiters must match within one line, cannot enclose an empty span, and must have non-whitespace text at their inner boundaries. Ordinary `C++` and `Price is 5 * 10` stay literal.
- Different marks can nest. Repeated nesting of the same mark is not supported. Combined examples include `***both***`, `**++bold underline++**`, and `=={green}**done**==`.
- Backslash escapes supported punctuation: backslash, `*`, `+`, `~`, `=`, brackets, parentheses, braces, `.`, `!`, and `-`. `\*\*literal\*\*` and `\==literal\==` display literal delimiters. Unsupported constructs and unmatched delimiters remain text.
- Unknown highlight colors/styles remain literal. Markdown never accepts arbitrary CSS or HTML.
- URLs must be absolute `https:`, `http:`, or nonempty `mailto:` URLs. Controls, whitespace, backslashes, relative/protocol-relative URLs, `javascript:`, and `data:` are rejected. Parentheses in URLs can balance or be backslash escaped on input; serialization percent-encodes them.
- Canonical nesting, outermost first: link, bold, italic, underline, strikethrough, highlight. Shared wrappers are reused across adjacent runs. Adjacent equal runs merge. Whitespace at formatting boundaries remains text but does not carry inline marks. Formatting empty text has no persisted representation.
- Canonical yellow marker omits its token (`==text==`), other marker colors omit `:marker`, and Soft includes `:soft`. Ordered runs restart at 1 after a non-numbered block.
- Literal delimiter punctuation is escaped on serialization, including literal leading list prefixes. Loading or focusing a value does not emit or canonicalize it; actual edits serialize it. Existing panel trimming on save remains unchanged.

## Highlights and appearance

The approved palette is `yellow #FFF59D`, `green #B9F6CA`, `pink #F8BBD0`, `blue #BBDEFB`, `orange #FFE0B2`, and `purple #E1BEE7`. Markdown stores only semantic names.

Marker has a pastel background, minimal padding, small radius, and a subtle lower edge. Soft blends the palette with white, adds rounded corners and a subtle outline. Both use dark text for contrast even on black note backgrounds. Shared styles keep editing and rendering consistent. UI surfaces use existing paper, text, border, and focus variables. The application currently declares a light color scheme; this change does not introduce a separate application dark theme.

## Architecture and safety

The pure parser is a bounded recursive scanner, not a giant replacement regex. It produces flat typed blocks containing text runs and approved marks. The serializer walks those runs and tracks nested delimiters. `stickyMarkdownToPlainText()` uses the same parser. Small façade classes `StickyMarkdownParser` and `StickyMarkdownSerializer` are also exported.

The editor uses contenteditable, Selection/Range, beforeinput/input, keyboard, composition, and clipboard events. Native typing keeps existing DOM nodes. Commands and pending-format typing update affected blocks; changes to list structure rebuild blocks and restore logical selection offsets. Selection offsets use UTF-16, matching browser Range offsets. No deprecated formatting API is used.

Undo history stores bounded internal snapshots, including Markdown and selection; it is limited to 100 entries and two million stored Markdown characters. Consecutive typing is grouped within 750 ms; commands form distinct steps. New edits clear redo.

All rendering uses created elements, allowlisted attributes, and text nodes. The renderer has no editing surface or history. Pasted HTML is parsed in an inert document and walked into the model, never adopted into the live DOM. Supported semantic tags, basic font marks, safe links, flat lists, and exact approved background colors are converted. Unsupported styling is removed; scripts, embedded media, SVG, and executable attributes are discarded. Excessively complex HTML falls back to the complete plain-text clipboard value. Copy exports plain text and HTML generated from the safe model.

Parser safety ceilings are 100,000 source characters, 10,000 blocks, 20,000 runs, and 16 nesting levels, with a shared per-line work budget. Oversized read-only input stays literal rather than disappearing. Clipboard traversal is bounded by node count and depth. An invalid edit is rejected as a whole and announces a limit message; Markdown is never sliced at an arbitrary stored-character boundary.

## Existing integrations and API contract

The Add/Edit side panel now uses visual editors for the optional title, required details, checklist headings, and checklist items. Existing validation and limits remain: title 200, details 10,000, checklist title 120, checklist item 300 **stored UTF-16 characters including syntax**. The visible word ceiling is optional and can be configured after backend limits change.

Workspace/folder/column selection, note dates, appearance settings, favourites, assignees, checklist IDs, ordering, completion state, and existing create/update service calls are preserved. Focus navigation recognizes contenteditable and does not intercept multiline caret movement. Checklist completion styling targets the new surface.

Shared note cards cover grid/Kanban/Today views and live previews. Markdown rendering is additionally integrated into My Notes tables, Today tables, favourites tables, trash, overdue notes, and checklist labels. Existing card and Today-table inline editing uses the visual editor so saved syntax is not exposed there. Plain-text extraction is used for local search, note accessibility labels, tooltips, confirmation messages, and favourite notifications. The unused legacy Add/Edit modal and the generic non-note card component were not redesigned.

Example note create/update HTTP body, using the existing fields:

```json
{
  "workspaceId": "workspace-1",
  "workspaceFolderId": "folder-1",
  "columnId": "column-1",
  "title": "Review **launch** tasks",
  "content": "Complete =={green:soft}important== tasks.\n\n- Review pricing\n- Test checkout",
  "noteDate": null,
  "color": "YELLOW",
  "shape": "SQUARE",
  "variant": "PLAIN",
  "backgroundPattern": "NONE"
}
```

The service allowlists `title`/`content` and passes their strings through; it does not strip Markdown. Checklists still use their separate existing endpoints and string `title` properties. Assignee syncing also remains separate. Backend acceptance, exact server limits, server-side transformations, and durability cannot be established from this frontend repository. No live persistence claim is made.

## Verification

Run the targeted suite using the existing Angular/Vitest infrastructure:

```sh
ng test --watch=false --ts-config tsconfig.markdown-regression.json --include 'src/app/shared/utils/sticky-markdown/*.spec.ts' --include 'src/app/shared/components/sticky-markdown-editor/*.spec.ts' --include 'src/app/shared/components/sticky-markdown-renderer/*.spec.ts' --include 'src/app/private/mynotes/add-edit-note-side-panel/add-edit-note-side-panel.spec.ts'
ng build
```

Tests cover syntax, all colors/styles, nested marks, 256 adjacent basic-mark combinations, canonical round trips, links/escaping, hostile/malformed input, list transforms, clipboard conversion, selection restoration, history, limits, CVA/reset/disabled behavior, partial and pending formatting, IME event handling, and renderer safety. Side-panel tests cover create/update payloads, dirty state, reopened simulated saved values, preview output, and independent checklist state, alongside existing open/close tests.

Test and build outcomes are reported in the delivery response. Browser automation was unavailable in this session (no connected browser). Unit tests use jsdom and do not establish actual native typing, mobile/IME, popup geometry, clipboard interoperability, or cross-browser behavior. Before release, manually exercise these at the showcase and in a signed-in side panel, including save/reload against a test backend.

## Backend Review Requirements — Next Phase

1. **Character limits:** Confirm the actual server limits and whether they count UTF-16 code units, Unicode code points, or bytes. The frontend currently respects existing configured limits including markup. Raising visible text to about 5,000 words requires a coordinated stored-length increase with allowance for links, escaping, and formatting overhead.
2. **Markdown validation:** No schema migration is necessary merely to store strings. Verify existing validation permits the supported punctuation and returns it unchanged. Any backend Markdown validator must use this subset; generic CommonMark does not understand `++` or semantic highlights.
3. **Search:** Frontend search matches parsed visible text. Backend search/filter/indexing may still search raw Markdown. Consider a derived plain-text search value without replacing the stored Markdown or adding required API fields.
4. **Stored-string safety:** Preserve strings faithfully and avoid interpreting embedded HTML. Continue escaping/sanitizing at each rendering boundary; storage alone does not make content safe.
5. **Other renderers:** Email, push messages, exports, other clients, and server-generated views need this grammar or a compatible plain-text projection. This frontend renderer cannot update those consumers.
6. **Expansion:** Reassess request limits, storage validation, rendering performance, complexity ceilings, and search indexing before enabling the configurable 5,000-word target. Test real API persistence, rejection behavior, and old plain-text notes containing intentional delimiter pairs.

## File inventory

New implementation files:

- `src/app/shared/components/sticky-markdown-editor/`: component TS/HTML/SCSS/spec, shared `_markdown-content.scss`, toolbar component, highlight-picker component, link-popover component.
- `src/app/shared/components/sticky-markdown-renderer/`: component TS/SCSS/spec (small template is inline).
- `src/app/shared/utils/sticky-markdown/`: `markdown.types.ts`, `markdown-parser.ts`, `markdown-serializer.ts`, `markdown-plain-text.ts`, `markdown-validator.ts`, `markdown-dom.ts`, `markdown-selection.ts`, `markdown-formatting.ts`, `markdown-history.ts`, `markdown-clipboard.ts`, and `markdown.spec.ts`.
- `src/app/showcase/markdown-editor-showcase/markdown-editor-showcase.ts`.
- `tsconfig.markdown-regression.json` and this document.

Modified existing files:

- Add/Edit note side panel TS/HTML/SCSS/spec.
- Shared note card (`private/mynotes/sticky-note`) TS/HTML.
- My Notes TS/HTML; Today TS/HTML; favourites TS/HTML; note trash TS/HTML; overdue notes TS/HTML.
- Favourite notification service, shared note validation helpers, and focus-navigation directive.
- Showcase routes.

No package manifest, lockfile, API service contract, or backend file was changed.
