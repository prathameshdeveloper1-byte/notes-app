export function pageToMarkdown(page) {
  const lines = [`# ${page.title}\n`];
  if (page.tags?.length) {
    lines.push(`Tags: ${page.tags.join(', ')}\n`);
  }
  lines.push('');
  try {
    const json = typeof page.contentJSON === 'string'
      ? JSON.parse(page.contentJSON)
      : page.contentJSON;
    lines.push(nodeToMarkdown(json));
  } catch {
    // ignore
  }
  return lines.join('\n');
}

export function nodeToMarkdown(node, indent = 0) {
  if (!node) return '';
  const pad = ' '.repeat(indent);

  switch (node.type) {
    case 'doc':
      return (node.content || []).map(n => nodeToMarkdown(n)).join('\n');
    case 'paragraph':
      return (node.content || []).map(n => nodeToMarkdown(n)).join('') + '\n';
    case 'heading': {
      const level = node.attrs?.level || 1;
      const prefix = '#'.repeat(level);
      return `${prefix} ${(node.content || []).map(n => nodeToMarkdown(n)).join('')}\n`;
    }
    case 'bulletList':
      return (node.content || []).map(n => `- ${nodeToMarkdown(n, indent + 2).trim()}`).join('\n') + '\n';
    case 'orderedList': {
      let i = 1;
      return (node.content || []).map(n => `${i++}. ${nodeToMarkdown(n, indent + 3).trim()}`).join('\n') + '\n';
    }
    case 'listItem':
      return (node.content || []).map(n => nodeToMarkdown(n)).join('');
    case 'blockquote':
      return (node.content || []).map(n => `> ${nodeToMarkdown(n).trim()}`).join('\n') + '\n';
    case 'codeBlock':
      return `\`\`\`${node.attrs?.language || ''}\n${(node.content || []).map(n => nodeToMarkdown(n)).join('')}\`\`\`\n`;
    case 'taskList':
      return (node.content || []).map(n => nodeToMarkdown(n)).join('\n') + '\n';
    case 'taskItem': {
      const checked = node.attrs?.checked ? '[x]' : '[ ]';
      return `${checked} ${(node.content || []).map(n => nodeToMarkdown(n)).join('').trim()}\n`;
    }
    case 'image':
      return `\n![${node.attrs?.alt || 'image'}](${node.attrs?.src})\n`;
    case 'table': {
      return '\n' + (node.content || []).map((row, idx) => {
        const rowMd = nodeToMarkdown(row);
        if (idx === 0) {
          const cellCount = row.content?.length || 1;
          const sep = '| ' + Array(cellCount).fill('---').join(' | ') + ' |\n';
          return rowMd + sep;
        }
        return rowMd;
      }).join('') + '\n';
    }
    case 'tableRow': {
      const cells = (node.content || []).map(cell => nodeToMarkdown(cell).trim().replace(/\n+/g, ' '));
      return `| ${cells.join(' | ')} |\n`;
    }
    case 'tableHeader':
    case 'tableCell':
      return (node.content || []).map(n => nodeToMarkdown(n)).join('').trim();
    case 'text': {
      let t = node.text || '';
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === 'bold') t = `**${t}**`;
          if (mark.type === 'italic') t = `_${t}_`;
          if (mark.type === 'code') t = `\`${t}\``;
          if (mark.type === 'underline') t = `<u>${t}</u>`;
          if (mark.type === 'highlight') t = `==${t}==`;
        }
      }
      return t;
    }
    case 'hardBreak':
      return '  \n';
    default:
      return (node.content || []).map(n => nodeToMarkdown(n)).join('');
  }
}
