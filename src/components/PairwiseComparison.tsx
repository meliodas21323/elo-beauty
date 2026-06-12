'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Heart, Undo, Trophy } from 'lucide-react';

type PairData = {
  left: { id: string; url: string };
  right: { id: string; url: string };
};

export default function PairwiseComparison() {
  const [pair, setPair] = useState<PairData | null>(null);
  const [pairsToday, setPairsToday] = useState(0);
  const [history, setHistory] = useState<PairData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPair();
  }, []);

  const fetchPair = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/pair');
      if (res.ok) {
        const data = await res.json();
        setPair(data);
      } else {
        console.error("Erreur lors de la récupération de la paire");
      }
    } catch (error) {
      console.error("Erreur réseau:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendVoteToBackend = async (winnerId: string, loserId: string, winner: 'left' | 'right' | 'draw') => {
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, loserId, winner })
      });
      if (res.ok) {
        console.log(`✅ Vote envoyé : ${winnerId} vs ${loserId} → ${winner}`);
      }
    } catch (error) {
      console.log("⚠️ Erreur lors de l'envoi du vote");
    }
  };

  const handleVote = async (winner: 'left' | 'right' | 'draw') => {
    if (!pair) return;

    navigator.vibrate?.([50]);
    setHistory(prev => [...prev, pair].slice(-10));
    
    if (winner === 'draw') {
      await sendVoteToBackend(pair.left.id, pair.right.id, 'draw');
    } else {
      const winId = winner === 'left' ? pair.left.id : pair.right.id;
      const loseId = winner === 'left' ? pair.right.id : pair.left.id;
      await sendVoteToBackend(winId, loseId, winner);
    }

    setPairsToday(prev => Math.min(prev + 1, 100));
    await new Promise(r => setTimeout(r, 150));
    fetchPair();
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setPair(previous);
    setHistory(prev => prev.slice(0, -1));
    setPairsToday(prev => Math.max(0, prev - 1));
    navigator.vibrate?.([30]);
  };

  if (!pair || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Header avec padding pour safe area iOS */}
      <div 
        className="pt-[env(safe-area-inset-top)] px-4 pb-4 flex justify-between items-center border-b border-white/10 bg-black/90"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <div className="flex items-center gap-3">
          <Heart className="text-pink-500" size={26} />
          <div>
            <div className="font-semibold text-lg text-white">Elo Beauty</div>
            <div className="text-xs text-white/60">{pairsToday} / 100 aujourd'hui</div>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <a 
            href="/classement"
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-pink-600 hover:bg-pink-700 rounded-2xl text-white font-semibold transition"
          >
            <Trophy size={18} />
            <span className="hidden sm:inline">Classement</span>
          </a>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-white/30 rounded-2xl disabled:opacity-40 hover:border-white/60 text-white"
          >
            <Undo size={16} /> <span className="hidden xs:inline">Annuler</span>
          </motion.button>
          
          <button onClick={() => window.location.reload()}>
            <X size={24} className="text-white/70" />
          </button>
        </div>
      </div>

      <div className="text-center py-4 text-white/80 text-sm border-b border-white/10 px-4">
        Quelle femme est la plus belle ?
      </div>

      {/* Zone des images - prend l'espace disponible */}
      <div className="flex-1 flex gap-3 p-3 min-h-0">
        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => handleVote('left')}
          className="flex-1 relative rounded-3xl overflow-hidden cursor-pointer bg-black border border-white/10 flex items-center justify-center hover:border-pink-500/30 transition-colors"
        >
          <img 
            src={pair.left.url} 
            alt="Gauche" 
            className="max-w-full max-h-full object-contain"
          />
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => handleVote('right')}
          className="flex-1 relative rounded-3xl overflow-hidden cursor-pointer bg-black border border-white/10 flex items-center justify-center hover:border-pink-500/30 transition-colors"
        >
          <img 
            src={pair.right.url} 
            alt="Droite" 
            className="max-w-full max-h-full object-contain"
          />
        </motion.div>
      </div>

      {/* Bouton Égalité avec padding pour safe area bottom */}
      <div 
        className="p-4 pb-[env(safe-area-inset-bottom)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => handleVote('draw')}
          className="w-full py-6 text-lg font-semibold border-2 border-white/40 hover:border-white/70 rounded-3xl transition-all active:bg-white/5 text-white"
        >
          ÉGALITÉ
        </motion.button>
      </div>
    </div>
  );
}
