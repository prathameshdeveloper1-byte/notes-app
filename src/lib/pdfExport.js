export async function exportBookAsPDF(book, folders, pagesByFolder) {
  const html2pdf = (await import('html2pdf.js')).default;

  const container = document.createElement('div');
  container.style.cssText = 'font-family: Georgia, serif; color: #1a1a1a; background: white; padding: 20px;';

  // Cover
  const cover = document.createElement('div');
  cover.style.cssText = `
    background: ${book.coverColor};
    color: white;
    text-align: center;
    padding: 80px 40px;
    page-break-after: always;
  `;
  cover.innerHTML = `<h1 style="font-size:2.5rem;margin-bottom:8px">${book.title}</h1>
    <p style="opacity:0.8">Created ${new Date(book.createdAt).toLocaleDateString()}</p>`;
  container.appendChild(cover);

  // Table of Contents
  const toc = document.createElement('div');
  toc.style.cssText = 'page-break-after: always; padding: 40px;';
  toc.innerHTML = `<h2 style="font-size:1.8rem;border-bottom:2px solid #eee;padding-bottom:8px">Table of Contents</h2>`;
  const tocList = document.createElement('div');

  let pageNum = 1;
  for (const folder of folders) {
    const pages = pagesByFolder[folder.id] || [];
    if (!pages.length) continue;
    const fEl = document.createElement('div');
    fEl.style.cssText = 'margin-top:16px;';
    fEl.innerHTML = `<h3 style="font-size:1.1rem;color:#555">${folder.title}</h3>`;
    for (const page of pages) {
      const pEl = document.createElement('div');
      pEl.style.cssText = 'display:flex;justify-content:space-between;padding:4px 0 4px 16px;border-bottom:1px dotted #ddd';
      pEl.innerHTML = `<span>${page.title}</span><span>${pageNum}</span>`;
      fEl.appendChild(pEl);
      pageNum++;
    }
    tocList.appendChild(fEl);
  }
  toc.appendChild(tocList);
  container.appendChild(toc);

  // Pages
  for (const folder of folders) {
    const pages = pagesByFolder[folder.id] || [];
    if (!pages.length) continue;

    const fHeader = document.createElement('div');
    fHeader.style.cssText = 'page-break-before: always; padding: 40px 40px 0;';
    fHeader.innerHTML = `<h2 style="font-size:1.5rem;color:#666;border-bottom:1px solid #eee;padding-bottom:8px">${folder.title}</h2>`;
    container.appendChild(fHeader);

    for (const page of pages) {
      const pageEl = document.createElement('div');
      pageEl.style.cssText = 'page-break-inside: avoid; padding: 24px 40px;';
      pageEl.innerHTML = `
        <h3 style="font-size:1.3rem;margin-bottom:12px">${page.title}</h3>
        ${renderContentToHTML(page.contentJSON)}
      `;
      if (page.tags?.length) {
        pageEl.innerHTML += `<div style="margin-top:12px">${page.tags.map(t => `<span style="background:#f0f0f0;border-radius:4px;padding:2px 8px;margin-right:4px;font-size:0.8rem">${t}</span>`).join('')}</div>`;
      }
      container.appendChild(pageEl);
    }
  }

  document.body.appendChild(container);

  await html2pdf().from(container).set({
    margin: 0,
    filename: `${book.title}.pdf`,
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  }).save();

  document.body.removeChild(container);
}

function renderContentToHTML(contentJSON) {
  try {
    const json = typeof contentJSON === 'string' ? JSON.parse(contentJSON) : contentJSON;
    return renderNode(json);
  } catch {
    return '<p></p>';
  }
}

function renderNode(node) {
  if (!node) return '';
  if (node.type === 'doc') return (node.content || []).map(renderNode).join('');
  if (node.type === 'paragraph') return `<p>${(node.content || []).map(renderNode).join('')}</p>`;
  if (node.type === 'heading') return `<h${node.attrs?.level || 1}>${(node.content || []).map(renderNode).join('')}</h${node.attrs?.level || 1}>`;
  if (node.type === 'bulletList') return `<ul>${(node.content || []).map(renderNode).join('')}</ul>`;
  if (node.type === 'orderedList') return `<ol>${(node.content || []).map(renderNode).join('')}</ol>`;
  if (node.type === 'listItem') return `<li>${(node.content || []).map(renderNode).join('')}</li>`;
  if (node.type === 'blockquote') return `<blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#666">${(node.content || []).map(renderNode).join('')}</blockquote>`;
  if (node.type === 'codeBlock') return `<pre style="background:#f5f5f5;padding:12px;border-radius:4px"><code>${(node.content || []).map(renderNode).join('')}</code></pre>`;
  if (node.type === 'text') {
    let t = node.text || '';
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'bold') t = `<strong>${t}</strong>`;
        if (mark.type === 'italic') t = `<em>${t}</em>`;
        if (mark.type === 'code') t = `<code style="background:#f0f0f0;padding:2px 4px">${t}</code>`;
        if (mark.type === 'underline') t = `<u>${t}</u>`;
      }
    }
    return t;
  }
  if (node.type === 'hardBreak') return '<br/>';
  if (node.type === 'taskList') return `<ul style="list-style:none;padding-left:0">${(node.content || []).map(renderNode).join('')}</ul>`;
  if (node.type === 'taskItem') {
    const checked = node.attrs?.checked ? 'checked' : '';
    return `<li><input type="checkbox" ${checked} disabled> ${(node.content || []).map(renderNode).join('')}</li>`;
  }
  return (node.content || []).map(renderNode).join('');
}
