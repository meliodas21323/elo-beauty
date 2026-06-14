'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SideMenu from '@/components/SideMenu';

export default function ProfilPage() {
  const router = useRouter();
  const [judgeId, setJudgeId] = useState<string | null>(null);
  const [judgeName, setJudgeName] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
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

    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/stats?judgeId=${judgeId}`);
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [judgeId]);

  if (!judgeId || loading) {
    return (
      <div className="h-dvh bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-black border-b border-zinc-800 px-4 py-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex justify-between items-center">
          <SideMenu judgeName={judgeName || ''} />
          <h1 className="text-xl font-bold text-pink-500">Profil</h1>
          <div className="w-14"></div>
        </div>
      </header>

      {/* Contenu scrollable */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {stats && (
          <div className="space-y-3">
            
            {/* Infos du juge */}
            <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center text-2xl font-bold">
                  {stats.judge.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{stats.judge.name}</h2>
                  <p className="text-sm text-zinc-400">@{stats.judge.login}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-zinc-800">
                <p className="text-sm text-zinc-400">Inscrit le</p>
                <p className="text-base text-white font-medium">{stats.judge.inscriptionDate}</p>
              </div>
            </div>

            {/* Statistiques */}
            <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800">
              <h3 className="text-lg font-bold text-pink-500 mb-4">📊 Tes statistiques</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                  <span className="text-zinc-400">Nombre total de votes</span>
                  <span className="text-2xl font-bold text-white">{stats.stats.totalVotes}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                  <span className="text-zinc-400">Jours d'activité</span>
                  <span className="text-2xl font-bold text-white">{stats.stats.daysSinceInscription}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Moyenne de votes / jour</span>
                  <span className="text-2xl font-bold text-white">{stats.stats.averageVotesPerDay}</span>
                </div>
              </div>
            </div>

            {/* Message de motivation */}
            <div className="bg-zinc-900 p-4 rounded-xl border border-pink-900/30">
              <p className="text-sm text-zinc-300 text-center">
                {stats.stats.totalVotes < 10 && "Continue à voter pour améliorer la précision de ton classement !"}
                {stats.stats.totalVotes >= 10 && stats.stats.totalVotes < 50 && "Bon début ! Plus tu votes, plus ton classement sera fiable."}
                {stats.stats.totalVotes >= 50 && stats.stats.totalVotes < 100 && "Excellent engagement ! Ton classement devient très précis."}
                {stats.stats.totalVotes >= 100 && "Impressionnant ! Tu es un juge expérimenté."}
              </p>
            </div>

          </div>
        )}
      </main>

      {/* Barre de navigation en bas */}
      <nav className="flex-shrink-0 bg-black border-t border-zinc-800 px-4 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/vote')}
            className="p-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-base"
          >
            Voter
          </button>
          <button
            onClick={() => router.push('/classement')}
            className="p-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-base"
          >
            Classement
          </button>
        </div>
      </nav>
    </div>
  );
}
