'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VotePage() {
  const router = useRouter();
  const [judgeId, setJudgeId] = useState<string | null>(null);
  const [judgeName, setJudgeName] = useState<string | null>(null);
  const [leftImage, setLeftImage] = useState<any>(null);
  const [rightImage, setRightImage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('judgeId');
    const name = localStorage.getItem('judgeName');
    if (!id) {
      router.push('/');
    } else {
      setJudgeId(id);
      setJudgeName(name);
    }
  }, [router]);

  const fetchPair = async () => {
    if (!judgeId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/pair?judgeId=${judgeId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLeftImage(data.left);
      setRightImage(data.right);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (judgeId) fetchPair();
  }, [judgeId]);

  const handleVote = async (winnerId: string, loserId: string) => {
    if (!judgeId) return;
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judgeId, winnerId, loserId }),
      });
      if (!res.ok) throw new Error('Erreur de vote');
      fetchPair();
    } catch (err) {
      setError('Erreur lors du vote');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('judgeId');
    localStorage.removeItem('judgeName');
    router.push('/');
  };

  if (!judgeId || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-[env(safe-area-inset-top)]">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pt-[env(safe-area-inset-top)]">
      {/* Header FIXE en haut */}
      <header className="sticky top-0 z-10 bg-black border-b border-zinc-800 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-pink-500">Elo Beauty</h1>
            <p className="text-xs text-zinc-400">Juge : {judgeName}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Zone de vote scrollable avec padding en bas */}
      <main className="flex-1 p-4 overflow-y-auto pb-24">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* Images */}
        <div className="grid grid-cols-2 gap-3" style={{ minHeight: 'calc(100vh - 250px)' }}>
          {leftImage && (
            <button 
              onClick={() => handleVote(leftImage.id, rightImage.id)}
              className="relative rounded-xl overflow-hidden border-2 border-transparent hover:border-pink-500 transition-all active:scale-95 h-full"
            >
              <img 
                src={leftImage.url} 
                alt="Image gauche" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-center text-xs font-bold">
                Elo: {leftImage.elo}
              </div>
            </button>
          )}
          
          {rightImage && (
            <button 
              onClick={() => handleVote(rightImage.id, leftImage.id)}
              className="relative rounded-xl overflow-hidden border-2 border-transparent hover:border-pink-500 transition-all active:scale-95 h-full"
            >
              <img 
                src={rightImage.url} 
                alt="Image droite" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-center text-xs font-bold">
                Elo: {rightImage.elo}
              </div>
            </button>
          )}
        </div>
      </main>

      {/* Barre de navigation FIXE en bas */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 p-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => router.push('/classement')}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
          >
            Classement
          </button>
          <button 
            className="p-3 bg-pink-700 text-white font-bold rounded-lg"
          >
            Voter
          </button>
        </div>
      </nav>
    </div>
  );
}
