import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createGame, GameError, reduce, type NewGameOptions } from './engine/engine.ts';
import type { Action, GameState } from './engine/types.ts';
import { clearGame, cryptoSeed, loadGame, markTutorialSeen, saveGame, tutorialSeen } from './ui/storage.ts';
import Home from './components/Home.tsx';
import Setup from './components/Setup.tsx';
import Game from './components/Game.tsx';
import Rules from './components/Rules.tsx';
import Tutorial from './components/Tutorial.tsx';

type Screen = 'home' | 'setup' | 'game' | 'gallery';

const Gallery3D = lazy(() => import('./three/Gallery3D.tsx'));

export type Dispatch = (a: Action) => boolean;

export default function App() {
  const [game, setGame] = useState<GameState | null>(() => loadGame());
  const [screen, setScreen] = useState<Screen>('home');
  const [showRules, setShowRules] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !tutorialSeen());
  const [toast, setToast] = useState<string | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const dispatch: Dispatch = useCallback((a: Action) => {
    const cur = gameRef.current;
    if (!cur) return false;
    try {
      const next = reduce(cur, a);
      gameRef.current = next;
      setGame(next);
      saveGame(next);
      return true;
    } catch (e) {
      if (e instanceof GameError) setToast(e.message);
      else {
        console.error(e);
        setToast('Terjadi kesalahan. Permainan tetap tersimpan.');
      }
      return false;
    }
  }, []);

  const startGame = (opts: Omit<NewGameOptions, 'seed' | 'now'>) => {
    const g = createGame({ ...opts, seed: cryptoSeed(), now: Date.now() });
    gameRef.current = g;
    setGame(g);
    saveGame(g);
    setScreen('game');
  };

  const closeTutorial = () => {
    markTutorialSeen();
    setShowTutorial(false);
  };

  return (
    <>
      {screen === 'home' && (
        <Home
          hasSave={!!game && game.phase !== 'gameOver'}
          onContinue={() => setScreen('game')}
          onNew={() => setScreen('setup')}
          onRules={() => setShowRules(true)}
          onTutorial={() => setShowTutorial(true)}
          onGallery={() => setScreen('gallery')}
        />
      )}
      {screen === 'gallery' && (
        <Suspense fallback={<div className="gallery-loading">Menyiapkan galeri 3D…</div>}>
          <Gallery3D onClose={() => setScreen('home')} />
        </Suspense>
      )}
      {screen === 'setup' && <Setup onBack={() => setScreen('home')} onStart={startGame} />}
      {screen === 'game' && game && (
        <Game
          game={game}
          dispatch={dispatch}
          onRules={() => setShowRules(true)}
          onHome={() => setScreen('home')}
          onNewGame={() => {
            clearGame();
            setGame(null);
            setScreen('setup');
          }}
        />
      )}
      {showRules && <Rules onClose={() => setShowRules(false)} />}
      {showTutorial && <Tutorial onClose={closeTutorial} />}
      {toast && (
        <div className="toast" role="alert" onClick={() => setToast(null)}>
          {toast}
        </div>
      )}
    </>
  );
}
