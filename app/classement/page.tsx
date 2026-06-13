'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SideMenu from '@/components/SideMenu';

export default function ClassementPage() {
  const router = useRouter();
  const [judgeId, setJudgeId] = useState<string | null>(null);
  const [judgeName, setJudgeName] = useState<string | null>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!judgeId) return;

    const fetchRanking = async () => {
      try {
        const res = await fetch(`/api/ranking?judgeId=${judgeId}`);
        const data = await res.json();
        if (res.ok) {
          setRanking(data.ranking);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [judgeId]);

  if (!judgeId || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-[env(safe-area-inset-top)]">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pt-[env(safe-area-inset-top)]">
      {/* Header avec menu hamburger */}
      <header className="sticky top-0 z-10 bg-black border-b border-zinc-800 p-4">
        <div className="flex justify-between items-center">
          <SideMenu judgeName={judgeName || ''} />
          <h1 className="text-xl font-bold text-pink-500">Classement</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Liste scrollable */}
      <main className="flex-1 p-4 overflow-y-auto pb-24">
        {ranking.length === 0 ? (
          <div className="text-center text-zinc-400 mt-10">
            <p>Aucun vote enregistré pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ranking.map((item, index) => (
              <div key={item.id} className="flex items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                <div className="text-2xl font-bold text-zinc-500 w-10 text-center">
                  #{index + 1}
                </div>
                <img
                  src={item.url}
                  alt={`Rank ${index + 1}`}
                  className="w-14 h-14 object-cover rounded-lg mx-3 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-white">Elo: {item.elo}</div>
                  <div className="text-xs text-zinc-400">
                    {item.votes} votes ({item.wins}V - {item.losses}D)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Barre de navigation en bas */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 p-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/vote')}
            className="p-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg transition-colors"
          >
            Voter
          </button>
          <button
            className="p-3 bg-zinc-700 text-white font-medium rounded-lg"
          >
            Classement
          </button>
        </div>
      </nav>
    </div>
  );
}
