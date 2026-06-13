'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SideMenu from '@/components/SideMenu';

export default function ReglesPage() {
  const router = useRouter();
  const [judgeId, setJudgeId] = useState<string | null>(null);
  const [judgeName, setJudgeName] = useState<string | null>(null);

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

  if (!judgeId) {
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
          <h1 className="text-xl font-bold text-pink-500">Règles</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Contenu scrollable */}
      <main className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-4 text-zinc-300">
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-lg font-semibold text-white mb-2"> Le principe</h3>
            <p className="text-sm">Tu compares deux images et tu choisis celle que tu préfères. Répète l'opération autant de fois que tu veux pour établir ton classement personnel.</p>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-lg font-semibold text-white mb-2">📊 Le système Elo</h3>
            <p className="text-sm">Chaque image a un score Elo (commençant à 1200). Quand tu votes, le système ajuste les scores en fonction de la "surprise" du résultat.</p>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-lg font-semibold text-white mb-2"> Le classement</h3>
            <p className="text-sm">Ton classement est personnel et unique. Chaque juge a son propre classement basé sur ses votes. Plus tu votes, plus le classement devient précis.</p>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-lg font-semibold text-white mb-2">💡 Conseils</h3>
            <ul className="text-sm list-disc list-inside space-y-1">
              <li>Vote de manière instinctive</li>
              <li>Plus tu votes, meilleur sera ton classement</li>
              <li>Les images les moins votées apparaissent en priorité</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Barre de navigation en bas */}
      <nav className="flex-shrink-0 bg-black border-t border-zinc-800 px-4 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/vote')}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
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
      </nav>
    </div>
  );
}
