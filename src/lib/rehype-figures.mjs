// Turns Markdown image paragraphs into <figure> elements and wraps tables
// in a horizontally scrollable container.
//
//   ![alt](src.png)
//   *Caption text.*
//
// becomes <figure><img><figcaption>Caption text.</figcaption></figure>.
export default function rehypeFigures() {
  return (tree) => transformChildren(tree);
}

function transformChildren(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (child.type !== 'element') return child;
    if (child.tagName === 'table') {
      return {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrap'] },
        children: [child],
      };
    }
    if (child.tagName === 'p') {
      const figure = toFigure(child);
      if (figure) return figure;
    }
    transformChildren(child);
    return child;
  });
}

function toFigure(paragraph) {
  const parts = paragraph.children.filter(
    (c) => !(c.type === 'text' && c.value.trim() === ''),
  );
  const [img, caption, ...rest] = parts;
  if (rest.length > 0) return null;
  if (!isElement(img, 'img')) return null;
  if (caption && !isElement(caption, 'em')) return null;

  img.properties = { ...img.properties, loading: 'lazy', decoding: 'async' };
  const children = [img];
  if (caption) {
    children.push({
      type: 'element',
      tagName: 'figcaption',
      properties: {},
      children: caption.children,
    });
  }
  return { type: 'element', tagName: 'figure', properties: {}, children };
}

function isElement(node, tagName) {
  return node?.type === 'element' && node.tagName === tagName;
}
