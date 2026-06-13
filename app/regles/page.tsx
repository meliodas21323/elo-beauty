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
      <div className="min-h-screen bg-black flex items-center justify-center pt-[env(safe-area-inset-top)]">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pt-[env(safe-area-inset-top)]">
      <header className="sticky top-0 z-10 bg-black border-b border-zinc-800 p-4">
        <div className="flex justify-between items-center">
          <SideMenu judgeName={judgeName || ''} />
          <h1 className="text-xl font-bold text-pink-500">Règles</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <h2 className="text-2xl font-bold text-pink-500 mb-4">Comment ça marche ?</h2>
            <div className="space-y-4 text-zinc-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">🎯 Le principe</h3>
                <p>Tu compares deux images et tu choisis celle que tu préfères. Répète l'opération autant de fois que tu veux pour établir ton classement personnel.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">📊 Le système Elo</h3>
                <p>Chaque image a un score Elo (commençant à 1200). Quand tu votes, le système ajuste les scores en fonction de la "surprise" du résultat.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2"> Le classement</h3>
                <p>Ton classement est personnel et unique. Chaque juge a son propre classement basé sur ses votes.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 p-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push('/vote')} className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors">Voter</button>
          <button onClick={() => router.push('/classement')} className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors">Classement</button>
        </div>
      </nav>
    </div>
  );
}
