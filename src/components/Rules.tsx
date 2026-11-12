import { Fragment, type ReactNode } from 'react';
import rulesMd from '../../docs/cara-main.md?raw';
import Modal from './Modal.tsx';

// Renderer markdown mini (judul, paragraf, daftar, tabel, kutipan, tebal/miring)
// supaya halaman "Cara Main" & buku aturan cetak (docs/cara-main.md) selalu sama.

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    out.push(tok.startsWith('**') ? <strong key={k++}>{tok.slice(2, -2)}</strong> : <em key={k++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderMarkdown(md: string): ReactNode[] {
  const lines = md.split('\n');
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)![0].length;
      const text = line.replace(/^#+\s*/, '');
      const Tag = (['h1', 'h2', 'h3', 'h4'] as const)[Math.min(level, 4) - 1];
      nodes.push(<Tag key={key++}>{inline(text)}</Tag>);
      i++;
      continue;
    }
    if (line.startsWith('>')) {
      nodes.push(<blockquote key={key++}>{inline(line.replace(/^>\s*/, ''))}</blockquote>);
      i++;
      continue;
    }
    if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i].trim().slice(1, -1).split('|').map((c) => c.trim());
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      nodes.push(
        <div className="table-scroll" key={key++}>
          <table>
            <thead>
              <tr>{head.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^(\d+\.|-)\s/.test(line)) {
      const ordered = /^\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && /^(\d+\.|-)\s/.test(lines[i])) {
        items.push(lines[i].replace(/^(\d+\.|-)\s+/, ''));
        i++;
      }
      const List = ordered ? 'ol' : 'ul';
      nodes.push(
        <List key={key++}>
          {items.map((t, j) => (
            <li key={j}>{inline(t)}</li>
          ))}
        </List>,
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#|>|\||\d+\.\s|-\s)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    nodes.push(<p key={key++}>{inline(para.join(' '))}</p>);
  }
  return nodes;
}

export default function Rules({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="📖 Cara Main" onClose={onClose} className="modal-rules">
      <div className="rules">
        {renderMarkdown(rulesMd.replace(/^# .*\n/, '')).map((n, i) => (
          <Fragment key={i}>{n}</Fragment>
        ))}
      </div>
    </Modal>
  );
}
