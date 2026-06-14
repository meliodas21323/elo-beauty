'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Fonction pour avoir la date locale exacte de l'utilisateur
function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AccueilPage() {
  const router = useRouter();
  const [judgeName, setJudgeName] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const judgeId = localStorage.getItem('judgeId');
    const name = localStorage.getItem('judgeName');
    
    if (!judgeId) {
      router.push('/');
      return;
    }

    setJudgeName(name);

    // 1. Calculer la date locale sur l'iPhone
    const todayStr = getLocalDateString(new Date());

    // 2. Envoyer cette date au serveur
    fetch('/api/login-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgeId, loginDate: todayStr })
    }).then(() => {
      // 3. Demander le streak en précisant quelle est la date "aujourd'hui" pour le serveur
      return fetch(`/api/login-history?judgeId=${judgeId}&today=${todayStr}`);
    }).then(res => res.json()).then(data => {
      setStreak(data.streak);
      setLoading(false);
    }).catch(err => {
      console.error(err);
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

  return (
    <div className="h-dvh bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="relative mb-8">
        <svg width="120" height="160" viewBox="0 0 120 160" className="animate-flame">
          <path d="M60 10 C70 40, 90 60, 90 90 C90 120, 75 140, 60 140 C45 140, 30 120, 30 90 C30 60, 50 40, 60 10 Z" fill="url(#flameGradient)" className="animate-flame-outer" />
          <path d="M60 40 C65 60, 75 75, 75 95 C75 115, 68 130, 60 130 C52 130, 45 115, 45 95 C45 75, 55 60, 60 40 Z" fill="url(#innerFlameGradient)" className="animate-flame-inner" />
          <defs>
            <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff6b35" /><stop offset="50%" stopColor="#f7931e" /><stop offset="100%" stopColor="#ffcc00" />
            </linearGradient>
            <linearGradient id="innerFlameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffcc00" /><stop offset="100%" stopColor="#fff5cc" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="text-center mb-8">
        <div className="text-7xl font-bold text-white mb-2 animate-pulse">{streak}</div>
        <div className="text-xl text-zinc-400">
          {streak === 1 && "jour d'affilée"}
          {streak > 1 && "jours d'affilée"}
        </div>
      </div>

      <div className="text-center mb-12 max-w-sm">
        {streak === 1 && <p className="text-lg text-zinc-300">Premier jour de connexion ! Commence ta série maintenant 🔥</p>}
        {streak === 2 && <p className="text-lg text-zinc-300">Bon début <span className="text-pink-500 font-bold">{judgeName}</span> ! 2 jours, continue comme ça !</p>}
        {streak >= 3 && streak <= 6 && <p className="text-lg text-zinc-300">Bravo <span className="text-pink-500 font-bold">{judgeName}</span> ! {streak} jours d'affilée, tu prends le rythme ! 🔥</p>}
        {streak === 7 && <p className="text-lg text-zinc-300">Une semaine complète <span className="text-pink-500 font-bold">{judgeName}</span> ! Impressionnant ! 🔥</p>}
        {streak === 14 && <p className="text-lg text-zinc-300">2 semaines <span className="text-pink-500 font-bold">{judgeName}</span> ! Tu es un vrai juge ! 🔥</p>}
        {streak === 21 && <p className="text-lg text-zinc-300">3 semaines <span className="text-pink-500 font-bold">{judgeName}</span> ! Tu ne lâches rien ! 🔥</p>}
        {streak === 30 && <p className="text-lg text-zinc-300">Un mois entier <span className="text-pink-500 font-bold">{judgeName}</span> ! Légendaire ! 🔥</p>}
        {streak >= 60 && <p className="text-lg text-zinc-300"><span className="text-pink-500 font-bold">{judgeName}</span>, tu es une légende vivante ! {streak} jours ! 🔥</p>}
      </div>

      <button onClick={() => router.push('/vote')} className="w-full max-w-sm p-5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 text-lg">
        Continuer à voter
      </button>
      <button onClick={() => router.push('/classement')} className="mt-4 text-zinc-400 hover:text-white transition-colors text-base">
        Voir le classement
      </button>
    </div>
  );
}