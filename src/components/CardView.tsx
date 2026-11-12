import type { Card } from '../engine/types.ts';

export default function CardView({ card }: { card: Card }) {
  const good = card.side === 'kebaikan';
  return (
    <article className={`game-card deck-${card.deck}`}>
      <header className="game-card-head">
        <span className="game-card-deck">{card.deck === 'nasib' ? 'Kartu Nasib' : 'Kartu Warga'}</span>
        <span className={`ribbon ${good ? 'ribbon-good' : 'ribbon-satire'}`} title={good ? 'Kebaikan Indonesia' : 'Sindiran'}>
          {good ? '🇮🇩' : '😏'}
        </span>
      </header>
      <div className="game-card-body">
        <h3>{card.title}</h3>
        {card.tags.includes('bencana') && <span className="tag-bencana">[Bencana]</span>}
        <p className="game-card-text">{card.text}</p>
        <div className="game-card-effect">{card.effectText}</div>
      </div>
      <footer className="game-card-foot">{card.id}</footer>
    </article>
  );
}
