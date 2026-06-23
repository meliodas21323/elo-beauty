'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SideMenu from '@/components/SideMenu';

export default function VotePage() {
  const router = useRouter();
  const [judgeId, setJudgeId] = useState<string | null>(null);
  const [judgeName, setJudgeName] = useState<string | null>(null);
  const [leftImage, setLeftImage] = useState<any>(null);
  const [rightImage, setRightImage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showElo, setShowElo] = useState(false);
  const [animatingImage, setAnimatingImage] = useState<'left' | 'right' | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);
  
  const [lastVote, setLastVote] = useState<{ winnerId: string; loserId: string; timestamp: number } | null>(null);
  const [undoTimeLeft, setUndoTimeLeft] = useState(0);

  const pairQueueRef = useRef<any[]>([]);
  const recentlySeenRef = useRef<string[]>([]); // 🔥 Exclusion stricte
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const id = localStorage.getItem('judgeId');
    const name = localStorage.getItem('judgeName');
    if (!id) { router.push('/'); } 
    else { setJudgeId(id); setJudgeName(name); }
    const saved = localStorage.getItem('showElo');
    setShowElo(saved === 'true');
  }, [router]);

  useEffect(() => {
    if (undoTimeLeft > 0) {
      const timer = setTimeout(() => setUndoTimeLeft(undoTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (undoTimeLeft === 0 && lastVote) {
      setLastVote(null);
    }
  }, [undoTimeLeft, lastVote]);

  const preloadImage = (url: string) => {
    const img = new Image();
    img.src = url;
  };

  const fetchPairs = async () => {
    if (!judgeId) return [];
    try {
      // 🔥 Exclure TOUTES les images récemment vues (20 dernières)
      const excludeIds = recentlySeenRef.current.join(',');
      console.log('🔄 Fetch pairs - excludeIds:', recentlySeenRef.current.length, 'images');
      
      const res = await fetch(`/api/pair?judgeId=${judgeId}&excludeIds=${excludeIds}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      console.log(' Paires reçues:', data.pairs.length);
      return data.pairs;
    } catch (err: any) {
      throw new Error(err.message || 'Erreur de chargement');
    }
  };

  const preloadPairsProgressively = (pairs: any[]) => {
    pairs.slice(0, 3).forEach(pair => {
      preloadImage(pair.left.url);
      preloadImage(pair.right.url);
    });
    pairs.slice(3).forEach((pair, index) => {
      setTimeout(() => {
        preloadImage(pair.left.url);
        preloadImage(pair.right.url);
      }, index * 200);
    });
  };

  useEffect(() => {
    if (!judgeId) return;

    const loadInitialPairs = async () => {
      setLoading(true);
      setError('');
      try {
        const pairs = await fetchPairs();
        pairQueueRef.current = pairs;
        preloadPairsProgressively(pairs);
        
        if (pairs.length > 0) {
          setLeftImage(pairs[0].left);
          setRightImage(pairs[0].right);
          pairQueueRef.current = pairs.slice(1);
          recentlySeenRef.current.push(pairs[0].left.id, pairs[0].right.id);
        }
      } catch (err: any) {
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadInitialPairs();
  }, [judgeId]);

  const createParticles = (side: 'left' | 'right') => {
    const newParticles = [];
    const colors = ['#ff6b35', '#f7931e', '#ffcc00', '#ff1744', '#e91e63'];
    
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const distance = 80 + Math.random() * 40;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      
      newParticles.push({
        id: Date.now() + i,
        side,
        tx,
        ty,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 6
      });
    }
    
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 600);
  };

  const advanceQueue = () => {
    if (pairQueueRef.current.length > 0) {
      const nextPair = pairQueueRef.current[0];
      setLeftImage(nextPair.left);
      setRightImage(nextPair.right);
      pairQueueRef.current = pairQueueRef.current.slice(1);
      
      // 🔥 Ajouter à la liste des images vues (garder les 20 dernières)
      recentlySeenRef.current.push(nextPair.left.id, nextPair.right.id);
      if (recentlySeenRef.current.length > 20) {
        recentlySeenRef.current = recentlySeenRef.current.slice(-20);
      }

      // 🔥 Recharger quand la file est à moitié vide (moins de 10 paires restantes)
      if (pairQueueRef.current.length < 10 && !isFetchingRef.current) {
        isFetchingRef.current = true;
        console.log('🔄 Rechargement - file à', pairQueueRef.current.length, 'paires');
        fetchPairs().then(pairs => {
          pairQueueRef.current = [...pairQueueRef.current, ...pairs];
          preloadPairsProgressively(pairs);
          isFetchingRef.current = false;
        }).catch(err => {
          console.error(err);
          isFetchingRef.current = false;
        });
      }
    }
  };

  const handleVote = async (winnerId: string, loserId: string) => {
    if (!judgeId || animatingImage) return;
    setError('');
    
    const clickedSide = winnerId === leftImage.id ? 'left' : 'right';
    
    setAnimatingImage(clickedSide);
    setShowFlash(true);
    createParticles(clickedSide);
    
    setTimeout(() => setShowFlash(false), 300);
    
    setTimeout(() => {
      setAnimatingImage(null);
      advanceQueue();
    }, 400);

    setLastVote({ winnerId, loserId, timestamp: Date.now() });
    setUndoTimeLeft(10);

    fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgeId, winnerId, loserId }),
    }).catch(err => console.error('Erreur vote:', err));
  };

  const handleSkip = () => {
    if (animatingImage) return;
    setError('');
    
    setAnimatingImage('left');
    setLastVote(null);
    
    setTimeout(() => {
      setAnimatingImage(null);
      advanceQueue();
    }, 200);
  };

  const handleUndo = async () => {
    if (!lastVote || !judgeId) return;
    setError('');
    
    const res = await fetch('/api/undo-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgeId, winnerId: lastVote.winnerId, loserId: lastVote.loserId }),
    });

    if (res.ok) {
      setLastVote(null);
      setUndoTimeLeft(0);
    } else {
      setError("Impossible d'annuler ce vote.");
    }
  };

  if (!judgeId || loading) {
    return (
      <div className="h-dvh bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-black text-white flex flex-col overflow-hidden relative">
      {showFlash && (
        <div className="absolute inset-0 bg-white vote-flash pointer-events-none z-50"></div>
      )}

      <header className="flex-shrink-0 bg-black border-b border-zinc-800 px-4 py-3 relative z-10" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex justify-between items-center">
          <SideMenu judgeName={judgeName || ''} />
          <h1 className="text-xl font-bold text-pink-500">Elo Beauty</h1>
          <div className="w-14"></div>
        </div>
      </header>

      <main className="flex-1 px-3 pb-2 flex flex-col justify-end overflow-hidden min-h-0 relative">
        {error && (
          <div className="mb-3 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm text-center">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0 relative">
          {leftImage && (
            <button 
              onClick={() => handleVote(leftImage.id, rightImage.id)} 
              disabled={!!animatingImage}
              className={`relative rounded-xl overflow-hidden border-2 border-transparent hover:border-pink-500 transition-all bg-zinc-900 flex items-end justify-center w-full h-full ${
                animatingImage === 'left' ? 'vote-selected' : 
                animatingImage === 'right' ? 'vote-rejected' : ''
              }`}
            >
              <img src={leftImage.url} alt="Image gauche" className="w-full h-full object-contain" />
              {showElo && <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-center text-xs font-bold">Elo: {leftImage.elo}</div>}
              
              {particles.filter(p => p.side === 'left').map(particle => (
                <div
                  key={particle.id}
                  className="particle"
                  style={{
                    left: '50%', top: '50%', backgroundColor: particle.color,
                    width: `${particle.size}px`, height: `${particle.size}px`,
                    '--tx': `${particle.tx}px`, '--ty': `${particle.ty}px`
                  } as any}
                />
              ))}
            </button>
          )}
          {rightImage && (
            <button 
              onClick={() => handleVote(rightImage.id, leftImage.id)} 
              disabled={!!animatingImage}
              className={`relative rounded-xl overflow-hidden border-2 border-transparent hover:border-pink-500 transition-all bg-zinc-900 flex items-end justify-center w-full h-full ${
                animatingImage === 'right' ? 'vote-selected' : 
                animatingImage === 'left' ? 'vote-rejected' : ''
              }`}
            >
              <img src={rightImage.url} alt="Image droite" className="w-full h-full object-contain" />
              {showElo && <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-center text-xs font-bold">Elo: {rightImage.elo}</div>}
              
              {particles.filter(p => p.side === 'right').map(particle => (
                <div
                  key={particle.id}
                  className="particle"
                  style={{
                    left: '50%', top: '50%', backgroundColor: particle.color,
                    width: `${particle.size}px`, height: `${particle.size}px`,
                    '--tx': `${particle.tx}px`, '--ty': `${particle.ty}px`
                  } as any}
                />
              ))}
            </button>
          )}
        </div>
      </main>

      <div className="flex-shrink-0 py-2 flex justify-center bg-black relative z-10">
        <button
          onClick={handleSkip}
          disabled={!!animatingImage}
          className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 font-medium rounded-full transition-all text-sm flex items-center gap-2 border border-zinc-700 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          Passer ce duel
        </button>
      </div>

      {lastVote && (
        <button
          onClick={handleUndo}
          className="absolute bottom-24 right-4 z-50 bg-zinc-800/90 backdrop-blur-sm border border-zinc-600 text-white px-4 py-2 rounded-full shadow-lg active:scale-95 transition-all flex items-center gap-2 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Annuler ({undoTimeLeft}s)
        </button>
      )}

      <nav className="flex-shrink-0 bg-black border-t border-zinc-800 px-4 py-3 relative z-10" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push('/classement')} className="p-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-base">Classement</button>
          <button className="p-4 bg-pink-700 text-white font-bold rounded-lg text-base">Voter</button>
        </div>
      </nav>
    </div>
  );
}