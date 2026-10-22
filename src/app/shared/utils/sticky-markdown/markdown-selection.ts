import { StickySelection } from './markdown.types';

function blocksIn(root: HTMLElement): HTMLElement[] {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>('[data-sticky-block]'));
  return blocks.length ? blocks : [root];
}
export function captureStickySelection(root: HTMLElement): StickySelection | null {
  const selection = root.ownerDocument.getSelection();
  if (
    !selection?.rangeCount ||
    !root.contains(selection.anchorNode) ||
    !root.contains(selection.focusNode)
  )
    return null;
  const blocks = blocksIn(root);
  const offsetAt = (node: Node, offset: number): number => {
    let total = 0;
    for (const block of blocks) {
      if (block === node || block.contains(node)) {
        const range = root.ownerDocument.createRange();
        range.selectNodeContents(block);
        range.setEnd(node, offset);
        return total + range.toString().length;
      }
      total += (block.textContent?.length ?? 0) + 1;
    }
    // Select-all endpoints can refer to the surface or a list container.
    const range = root.ownerDocument.createRange();
    range.selectNodeContents(root);
    range.setEnd(node, offset);
    const text = range.toString().length;
    return (
      text + blocks.filter((block) => range.intersectsNode(block) && block !== blocks.at(-1)).length
    );
  };
  const anchor = offsetAt(selection.anchorNode!, selection.anchorOffset),
    focus = offsetAt(selection.focusNode!, selection.focusOffset);
  return { start: Math.min(anchor, focus), end: Math.max(anchor, focus), backward: anchor > focus };
}
export function restoreStickySelection(root: HTMLElement, value: StickySelection): void {
  const dom = root.ownerDocument,
    selection = dom.getSelection();
  if (!selection) return;
  const point = (offset: number): [Node, number] => {
    const blocks = blocksIn(root);
    let block = blocks.at(-1) ?? root;
    for (const item of blocks) {
      block = item;
      const length = item.textContent?.length ?? 0;
      if (offset <= length) break;
      offset -= length + 1;
    }
    const walker = dom.createTreeWalker(block, 4);
    let node: Node | null,
      last: Node | null = null;
    while ((node = walker.nextNode())) {
      last = node;
      if (offset <= (node.textContent?.length ?? 0)) return [node, Math.max(0, offset)];
      offset -= node.textContent?.length ?? 0;
    }
    return last ? [last, last.textContent?.length ?? 0] : [block, 0];
  };
  const start = point(value.start),
    end = point(value.end);
  if (selection.setBaseAndExtent)
    selection.setBaseAndExtent(
      ...(value.backward ? end : start),
      ...(value.backward ? start : end),
    );
  else {
    const range = dom.createRange();
    range.setStart(...start);
    range.setEnd(...end);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
