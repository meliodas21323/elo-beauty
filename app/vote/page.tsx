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
  
  const pairQueueRef = useRef<any[]>([]);
  const recentlySeenRef = useRef<string[]>([]);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const id = localStorage.getItem('judgeId');
    const name = localStorage.getItem('judgeName');
    if (!id) { router.push('/'); } 
    else { setJudgeId(id); setJudgeName(name); }
    const saved = localStorage.getItem('showElo');
    setShowElo(saved === 'true');
  }, [router]);

  const preloadImage = (url: string) => {
    const img = new Image();
    img.src = url;
  };

  const fetchPairs = async () => {
    if (!judgeId) return [];
    try {
      const excludeIds = recentlySeenRef.current.join(',');
      const res = await fetch(`/api/pair?judgeId=${judgeId}&excludeIds=${excludeIds}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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

  // Fonction pour avancer dans la file d'attente (utilisée par Vote et Passer)
  const advanceQueue = () => {
    if (pairQueueRef.current.length > 0) {
      const nextPair = pairQueueRef.current[0];
      setLeftImage(nextPair.left);
      setRightImage(nextPair.right);
      pairQueueRef.current = pairQueueRef.current.slice(1);
      
      recentlySeenRef.current.push(nextPair.left.id, nextPair.right.id);
      if (recentlySeenRef.current.length > 4) {
        recentlySeenRef.current = recentlySeenRef.current.slice(-4);
      }

      if (pairQueueRef.current.length < 3 && !isFetchingRef.current) {
        isFetchingRef.current = true;
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
    if (!judgeId) return;
    setError('');
    
    // 1. Avancer dans la file instantanément
    advanceQueue();

    // 2. Envoyer le vote en arrière-plan
    fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgeId, winnerId, loserId }),
    }).catch(err => console.error('Erreur vote:', err));
  };

  const handleSkip = () => {
    setError('');
    // Avance dans la file SANS envoyer de vote
    advanceQueue();
  };

  if (!judgeId || loading) {
    return (
      <div className="h-dvh bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-black text-white flex flex-col overflow-hidden">
      <header className="flex-shrink-0 bg-black border-b border-zinc-800 px-4 py-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex justify-between items-center">
          <SideMenu judgeName={judgeName || ''} />
          <h1 className="text-xl font-bold text-pink-500">Elo Beauty</h1>
          <div className="w-14"></div>
        </div>
      </header>

      <main className="flex-1 px-3 pb-2 flex flex-col justify-end overflow-hidden min-h-0">
        {error && (
          <div className="mb-3 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm text-center">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          {leftImage && (
            <button onClick={() => handleVote(leftImage.id, rightImage.id)} className="relative rounded-xl overflow-hidden border-2 border-transparent hover:border-pink-500 transition-all active:scale-95 bg-zinc-900 flex items-end justify-center w-full h-full">
              <img src={leftImage.url} alt="Image gauche" className="w-full h-full object-contain" />
              {showElo && <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-center text-xs font-bold">Elo: {leftImage.elo}</div>}
            </button>
          )}
          {rightImage && (
            <button onClick={() => handleVote(rightImage.id, leftImage.id)} className="relative rounded-xl overflow-hidden border-2 border-transparent hover:border-pink-500 transition-all active:scale-95 bg-zinc-900 flex items-end justify-center w-full h-full">
              <img src={rightImage.url} alt="Image droite" className="w-full h-full object-contain" />
              {showElo && <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-center text-xs font-bold">Elo: {rightImage.elo}</div>}
            </button>
          )}
        </div>
      </main>

      {/* Bouton Passer */}
      <div className="flex-shrink-0 py-2 flex justify-center bg-black">
        <button
          onClick={handleSkip}
          className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 font-medium rounded-full transition-all text-sm flex items-center gap-2 border border-zinc-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          Passer ce duel
        </button>
      </div>

      <nav className="flex-shrink-0 bg-black border-t border-zinc-800 px-4 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push('/classement')} className="p-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-base">Classement</button>
          <button className="p-4 bg-pink-700 text-white font-bold rounded-lg text-base">Voter</button>
        </div>
      </nav>
    </div>
  );
}