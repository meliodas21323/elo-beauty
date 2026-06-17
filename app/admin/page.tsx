'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_UUID = 'd8bf9451-284c-4927-bae2-f0910905f44e';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const judgeId = localStorage.getItem('judgeId');
    
    // Sécurité : si pas connecté ou pas Meliodas, redirection
    if (!judgeId || judgeId !== ADMIN_UUID) {
      router.push('/');
      return;
    }

    fetch(`/api/admin/stats?judgeId=${judgeId}`)
      .then(res => {
        if (!res.ok) throw new Error('Accès refusé');
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="h-dvh bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-dvh bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4"></div>
          <h1 className="text-2xl font-bold text-red-500 mb-2">Accès refusé</h1>
          <p className="text-zinc-400 mb-6">Cette page est réservée à l'administrateur.</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-pink-600 text-white rounded-lg">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="bg-black border-b border-zinc-800 px-4 py-3 sticky top-0 z-10" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex justify-between items-center">
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-pink-500">Dashboard Admin</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Vue d'ensemble */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-pink-500">📊</span> Vue d'ensemble
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-pink-500">{data.overview.totalJudges}</div>
              <div className="text-xs text-zinc-400 mt-1">Juges inscrits</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-pink-500">{data.overview.totalImages}</div>
              <div className="text-xs text-zinc-400 mt-1">Images</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-pink-500">{data.overview.totalDuels.toLocaleString()}</div>
              <div className="text-xs text-zinc-400 mt-1">Duels totaux</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-pink-500">{data.overview.totalVotes.toLocaleString()}</div>
              <div className="text-xs text-zinc-400 mt-1">Votes individuels</div>
            </div>
          </div>
        </section>

        {/* Activité par juge */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-pink-500">👥</span> Activité par juge
          </h2>
          <div className="space-y-2">
            {data.judgeStats.map((judge: any) => (
              <div key={judge.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-white">{judge.name}</div>
                    <div className="text-xs text-zinc-500">
                      Inscrit le {new Date(judge.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  {judge.id === ADMIN_UUID && (
                    <span className="text-xs bg-pink-600/20 text-pink-400 px-2 py-1 rounded-full">Admin</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-zinc-800 rounded-lg py-2">
                    <div className="text-lg font-bold text-white">{judge.totalDuels}</div>
                    <div className="text-xs text-zinc-400">Duels</div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg py-2">
                    <div className="text-lg font-bold text-white">{judge.totalVotes}</div>
                    <div className="text-xs text-zinc-400">Votes</div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg py-2">
                    <div className="text-lg font-bold text-white">{judge.imagesVoted}</div>
                    <div className="text-xs text-zinc-400">Images</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Images débat */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-pink-500">️</span> Images qui font débat
            <span className="text-xs text-zinc-500 font-normal ml-auto">Top 10</span>
          </h2>
          {data.debateImages.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-zinc-400">
              Pas encore assez de données (il faut au moins 2 juges par image)
            </div>
          ) : (
            <div className="space-y-2">
              {data.debateImages.map((img: any, index: number) => (
                <div key={img.imageId} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-pink-500 font-bold">#{index + 1}</span>
                      <span className="text-xs text-zinc-400 font-mono">{img.imageId.slice(0, 8)}...</span>
                    </div>
                    <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded-full">
                      Écart-type: {img.stdDev}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <div className="text-white font-bold">{img.judgeCount}</div>
                      <div className="text-zinc-500">Juges</div>
                    </div>
                    <div>
                      <div className="text-white font-bold">{img.meanElo}</div>
                      <div className="text-zinc-500">Moy. Elo</div>
                    </div>
                    <div>
                      <div className="text-green-400 font-bold">{img.minElo}</div>
                      <div className="text-zinc-500">Min</div>
                    </div>
                    <div>
                      <div className="text-red-400 font-bold">{img.maxElo}</div>
                      <div className="text-zinc-500">Max</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}