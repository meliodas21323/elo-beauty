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
  
  // File d'attente des paires
  const pairQueueRef = useRef<any[]>([]);

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
      const res = await fetch(`/api/pair?judgeId=${judgeId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Précharger toutes les images
      data.pairs.forEach((pair: any) => {
        preloadImage(pair.left.url);
        preloadImage(pair.right.url);
      });
      
      return data.pairs;
    } catch (err: any) {
      throw new Error(err.message || 'Erreur de chargement');
    }
  };

  useEffect(() => {
    if (!judgeId) return;

    const loadInitialPairs = async () => {
      setLoading(true);
      setError('');
      try {
        const pairs = await fetchPairs();
        pairQueueRef.current = pairs;
        
        // Afficher la première paire
        if (pairs.length > 0) {
          setLeftImage(pairs[0].left);
          setRightImage(pairs[0].right);
          pairQueueRef.current = pairs.slice(1);
        }
      } catch (err: any) {
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadInitialPairs();
  }, [judgeId]);

  const handleVote = async (winnerId: string, loserId: string) => {
    if (!judgeId) return;
    setError('');

    // Afficher immédiatement la paire suivante de la file
    if (pairQueueRef.current.length > 0) {
      const nextPair = pairQueueRef.current[0];
      setLeftImage(nextPair.left);
      setRightImage(nextPair.right);
      pairQueueRef.current = pairQueueRef.current.slice(1);
      
      // Si la file est vide, recharger
      if (pairQueueRef.current.length === 0) {
        fetchPairs().then(pairs => {
          pairQueueRef.current = pairs;
        }).catch(err => console.error(err));
      }
    }

    // Envoyer le vote en arrière-plan (fire-and-forget)
    fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgeId, winnerId, loserId }),
    }).catch(err => console.error('Erreur vote:', err));
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

      <main className="flex-1 px-3 pb-3 flex flex-col justify-end overflow-hidden">
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

      <nav className="flex-shrink-0 bg-black border-t border-zinc-800 px-4 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push('/classement')} className="p-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-base">Classement</button>
          <button className="p-4 bg-pink-700 text-white font-bold rounded-lg text-base">Voter</button>
        </div>
      </nav>
    </div>
  );
}