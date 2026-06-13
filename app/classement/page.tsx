'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-black text-white flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* En-tête */}
      <header className="p-4 flex justify-between items-center border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-pink-500">Classement</h1>
          <p className="text-xs text-zinc-400">Juge : {judgeName}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300"
        >
          Déconnexion
        </button>
      </header>

      {/* Liste du classement - Adapté mobile */}
      <main className="flex-1 p-4 overflow-y-auto">
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

      {/* Navigation */}
      <footer className="p-4 border-t border-zinc-800">
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => router.push('/vote')}
            className="p-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg transition-colors"
          >
            Voter
          </button>
          <button 
            onClick={() => router.push('/classement')}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
          >
            Classement
          </button>
        </div>
      </footer>
    </div>
  );
}
