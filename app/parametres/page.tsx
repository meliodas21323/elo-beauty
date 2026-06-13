'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SideMenu from '@/components/SideMenu';

export default function ParametresPage() {
  const router = useRouter();
  const [judgeId, setJudgeId] = useState<string | null>(null);
  const [judgeName, setJudgeName] = useState<string | null>(null);
  const [showElo, setShowElo] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('judgeId');
    const name = localStorage.getItem('judgeName');
    if (!id) {
      router.push('/');
    } else {
      setJudgeId(id);
      setJudgeName(name);
    }

    // Charger la préférence (défaut: false)
    const saved = localStorage.getItem('showElo');
    setShowElo(saved === 'true');
  }, [router]);

  const handleToggleElo = () => {
    const newValue = !showElo;
    setShowElo(newValue);
    localStorage.setItem('showElo', String(newValue));
  };

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
          <h1 className="text-xl font-bold text-pink-500">Paramètres</h1>
          <div className="w-12"></div>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-3">
          {/* Toggle Afficher les points Elo */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-1">Afficher les points Elo</h3>
                <p className="text-sm text-zinc-400">
                  Affiche le score Elo sous chaque photo pendant le vote
                </p>
              </div>
              <button
                onClick={handleToggleElo}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  showElo ? 'bg-pink-600' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    showElo ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-base font-semibold text-white mb-2">️ À propos</h3>
            <p className="text-sm text-zinc-400">
              Elo Beauty v1.0 - Classement par système Elo
            </p>
            <p className="text-sm text-zinc-400 mt-2">
              Juge connecté : <span className="text-pink-500 font-medium">{judgeName}</span>
            </p>
          </div>
        </div>
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
