import type { GameState } from '../engine/types.ts';

export default function LogPanel({ game }: { game: GameState }) {
  const items = game.log.slice(-80).reverse();
  return (
    <ol className="log" aria-label="Log kejadian">
      {items.map((e) => (
        <li key={e.id} className={`log-${e.tone ?? 'info'}`}>
          <span className="log-round">P{e.round}</span>
          {e.text}
        </li>
      ))}
    </ol>
  );
}
