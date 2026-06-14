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
          <div className="w-14"></div>
        </div>
      </header>

      {/* Contenu scrollable */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          
          {/* Intro */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h2 className="text-xl font-bold text-pink-500 mb-2">Comment bien voter ?</h2>
            <p className="text-sm text-zinc-400">Pour un classement juste et fiable, suis ces règles :</p>
          </div>

          {/* Les 6 règles de comportement */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-base font-semibold text-white mb-2">1. Juge la photo, pas la personne</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">Évalue ce que tu vois sur l'image à cet instant précis. Une fille peut être très à son avantage sur une photo et moins sur une autre. C'est normal, c'est le jeu.</p>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-base font-semibold text-white mb-2">2. Reste dans le présent</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">Ne projette pas. Tu ne votes pas pour ce qu'elle serait sans maquillage, avec une autre coiffure, ou dans un autre contexte. Tu votes pour ce que la photo te montre, maintenant.</p>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-base font-semibold text-white mb-2">3. En cas de doute, prends ton temps</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">Regarde chaque image 2-3 secondes, plusieurs fois. Ton intuition finira par trancher. Si le doute persiste vraiment, utilise le bouton "Passer" (à venir) plutôt que de voter au hasard.</p>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-base font-semibold text-white mb-2">4. Oublie tes préférences personnelles</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">On évalue la beauté, pas ton "type". L'âge, l'ethnie, le style vestimentaire ne doivent pas influencer ton vote. Reste objectif.</p>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-base font-semibold text-white mb-2">5. Ignore la répétition</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">Tu vas revoir les mêmes filles plusieurs fois, sous des angles différents. C'est volontaire : ça apporte de la diversité. Ne pénalise pas une fille parce que tu l'as déjà vue, ne la favorise pas non plus.</p>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-red-900/50">
            <h3 className="text-base font-semibold text-red-400 mb-2 flex items-center gap-2">
              <span>⚠️</span> 6. La fatigue fausse tout
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">Si tu commences à voter machinalement, fais une pause. Reviens quand tu es frais. Un vote fatigué est un vote injuste.</p>
          </div>

          {/* Séparateur pour les explications techniques */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mt-4">
            <h2 className="text-xl font-bold text-pink-500 mb-2">Fonctionnement de l'application</h2>
          </div>

          {/* Les anciennes règles (Principe, Elo, etc.) */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-base font-semibold text-white mb-2">🎯 Le principe</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">Tu compares deux images et tu choisis celle que tu préfères. Répète l'opération autant de fois que tu veux pour établir ton classement personnel.</p>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-base font-semibold text-white mb-2"> Le système Elo</h3>
            <p className="text-sm text-zinc-300 leading-relaxed mb-2">Chaque image a un score Elo (commençant à 1200). Quand tu votes :</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
              <li>Si tu choisis une image avec un score élevé, elle gagne peu de points</li>
              <li>Si tu choisis une image avec un score bas, elle gagne beaucoup de points</li>
              <li>Le système s'adapte pour refléter tes préférences réelles</li>
            </ul>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-base font-semibold text-white mb-2">🏆 Le classement</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">Ton classement est personnel et unique. Chaque juge a son propre classement basé sur ses votes. Plus tu votes, plus le classement devient précis.</p>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-base font-semibold text-white mb-2"> Conseils</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
              <li>Vote de manière instinctive, ne réfléchis pas trop</li>
              <li>Plus tu votes, meilleur sera ton classement</li>
              <li>Tu peux consulter ton classement à tout moment</li>
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
