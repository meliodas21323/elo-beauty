'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Award } from 'lucide-react';

type ImageStats = {
  id: string;
  elo: number;
  votes: number;
  wins: number;
  losses: number;
  draws: number;
};

type LeaderboardData = {
  totalVotes: number;
  totalImages: number;
  images: ImageStats[];
};

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

    const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      // Récupérer le juge actuel depuis le localStorage
      const currentJudgeStr = localStorage.getItem('elo_beauty_current_judge');
      const judgeId = currentJudgeStr ? JSON.parse(currentJudgeStr).id : null;

      if (!judgeId) {
        setData(null);
        return;
      }

      const res = await fetch(`/api/vote?judgeId=${judgeId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-400" size={24} />;
    if (index === 1) return <Medal className="text-gray-400" size={24} />;
    if (index === 2) return <Award className="text-orange-400" size={24} />;
    return <span className="text-white/60 font-bold w-6 text-center">#{index + 1}</span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Chargement du classement...</p>
        </div>
      </div>
    );
  }

  if (!data || data.images.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Aucun classement disponible</h1>
        <p className="text-white/60 text-center mb-6">
          Fais quelques votes pour voir apparaître le classement !
        </p>
        <a href="/" className="px-6 py-3 bg-pink-600 rounded-xl font-semibold hover:bg-pink-700 transition">
          Commencer à voter
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header avec safe area iOS */}
      <div 
        className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-white/10 px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', paddingBottom: '16px' }}
      >
        <div className="flex items-center gap-4">
          <a href="/" className="p-2 hover:bg-white/10 rounded-full transition">
            <ArrowLeft size={24} />
          </a>
          <div>
            <h1 className="text-xl font-bold">Classement Elo</h1>
            <p className="text-xs text-white/60">
              {data.totalVotes} votes • {data.totalImages} images classées
            </p>
          </div>
        </div>
      </div>

      {/* Liste complète */}
      <div className="p-4 space-y-3">
        {data.images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/10 hover:border-pink-500/30 transition"
          >
            <div className="w-10 flex justify-center">
              {getRankIcon(index)}
            </div>

            <div className="w-16 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0">
              <img 
                src={`/images/${encodeURIComponent(image.id)}`} 
                alt={`Rank ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-pink-500">{image.elo}</span>
                <span className="text-xs text-white/60">ELO</span>
              </div>
              <div className="flex gap-3 text-xs text-white/60">
                <span>{image.votes} votes</span>
                <span className="text-green-400">{image.wins}W</span>
                <span className="text-red-400">{image.losses}L</span>
                <span className="text-yellow-400">{image.draws}D</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold text-white/80">
                {image.votes > 0 ? Math.round((image.wins / image.votes) * 100) : 0}%
              </div>
              <div className="text-xs text-white/60">win rate</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer avec safe area bottom */}
      <div 
        className="p-4 text-center text-xs text-white/40"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        {data.images.length} images classées • Plus de votes = classement plus précis
      </div>
    </div>
  );
}
