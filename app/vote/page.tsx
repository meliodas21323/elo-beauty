'use client';

import { useState, useEffect } from 'react';
import { useJudge } from '../../src/context/JudgeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Undo, Trophy, LogOut, Heart, BookOpen, X } from 'lucide-react';

type PairData = {
  left: { id: string; url: string };
  right: { id: string; url: string };
};

const RULES = [
  {
    icon: '🎯',
    title: 'Juge la photo, pas la personne',
    text: 'Évalue ce que tu vois sur l\'image à cet instant précis. Une fille peut être très à son avantage sur une photo et moins sur une autre. C\'est normal, c\'est le jeu.'
  },
  {
    icon: '⏱️',
    title: 'Reste dans le présent',
    text: 'Ne projette pas. Tu ne votes pas pour ce qu\'elle serait sans maquillage, avec une autre coiffure, ou dans un autre contexte. Tu votes pour ce que la photo te montre, maintenant.'
  },
  {
    icon: '🤔',
    title: 'En cas de doute, prends ton temps',
    text: 'Regarde chaque image 2-3 secondes, plusieurs fois. Ton intuition finira par trancher. Si le doute persiste vraiment, utilise le bouton "Passer" plutôt que de voter au hasard.'
  },
  {
    icon: '️',
    title: 'Oublie tes préférences personnelles',
    text: 'On évalue la beauté, pas ton "type". L\'âge, l\'ethnie, le style vestimentaire ne doivent pas influencer ton vote. Reste objectif.'
  },
  {
    icon: '🔄',
    title: 'Ignore la répétition',
    text: 'Tu vas revoir les mêmes filles plusieurs fois, sous des angles différents. C\'est volontaire : ça apporte de la diversité. Ne pénalise pas une fille parce que tu l\'as déjà vue, ne la favorise pas non plus.'
  },
  {
    icon: '😴',
    title: 'La fatigue fausse tout',
    text: 'Si tu commences à voter machinalement, fais une pause. Reviens quand tu es frais. Un vote fatigué est un vote injuste.'
  }
];

export default function VotePage() {
  const { currentJudge, logout } = useJudge();
  const [pair, setPair] = useState<PairData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<PairData[]>([]);
  const [pairsToday, setPairsToday] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (!currentJudge) {
      window.location.href = '/';
    }
  }, [currentJudge]);

  useEffect(() => {
    if (currentJudge) {
      fetchPair();
    }
  }, [currentJudge]);

    const fetchPair = async () => {
    setIsLoading(true);
    try {
      // On envoie l'ID du juge en paramètre
      const res = await fetch(`/api/pair?judgeId=${currentJudge?.id}`);
      if (res.ok) {
        const data = await res.json();
        setPair(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendVote = async (winnerId: string, loserId: string, winner: 'left' | 'right') => {
    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          winnerId, 
          loserId, 
          winner,
          judgeId: currentJudge?.id 
        })
      });
    } catch (error) {
      console.error("Erreur vote:", error);
    }
  };

  const handleVote = async (winner: 'left' | 'right') => {
    if (!pair) return;

    navigator.vibrate?.([50]);
    setHistory(prev => [...prev, pair].slice(-10));
    
    const winId = winner === 'left' ? pair.left.id : pair.right.id;
    const loseId = winner === 'left' ? pair.right.id : pair.left.id;
    await sendVote(winId, loseId, winner);

    setPairsToday(prev => prev + 1);
    await new Promise(r => setTimeout(r, 200));
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

  if (!currentJudge) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoading || !pair) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header ultra compact */}
      <div 
        className="flex items-center justify-between px-2 border-b border-white/5 bg-zinc-950/95 flex-shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4px)', paddingBottom: '4px' }}
      >
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={16} className="text-white/70" />
        </button>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5">
          <Heart className="text-pink-500" size={10} fill="currentColor" />
          <span className="text-white text-xs font-semibold">{pairsToday}</span>
        </div>

        <button 
          onClick={handleUndo}
          disabled={history.length === 0}
          className="p-1.5 rounded-full hover:bg-white/10 transition disabled:opacity-30"
        >
          <Undo size={16} className="text-white/70" />
        </button>
      </div>

      {/* Zone images */}
      <div className="flex-1 flex items-center justify-center px-2 min-h-0">
        <div className="flex gap-1.5 w-full max-w-2xl items-center">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleVote('left')}
            className="flex-1 relative rounded-lg overflow-hidden bg-zinc-900 border border-white/5 hover:border-pink-500/30 transition-all"
          >
            <img 
              src={pair.left.url} 
              alt="Gauche" 
              className="w-full max-h-[45vh] object-contain"
            />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleVote('right')}
            className="flex-1 relative rounded-lg overflow-hidden bg-zinc-900 border border-white/5 hover:border-pink-500/30 transition-all"
          >
            <img 
              src={pair.right.url} 
              alt="Droite" 
              className="w-full max-h-[45vh] object-contain"
            />
          </motion.button>
        </div>
      </div>

      {/* Menu latéral */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-zinc-900 z-50 p-6 border-r border-white/10"
              style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}
            >
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {currentJudge.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{currentJudge.name}</div>
                    <div className="text-xs text-white/40">{pairsToday} votes aujourd'hui</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <a 
                  href="/classement"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition text-white"
                >
                  <Trophy size={20} className="text-pink-500" />
                  <span>Classement</span>
                </a>

                {/* NOUVEAU BOUTON RÈGLES */}
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    setShowRules(true);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition text-blue-400 w-full text-left"
                >
                  <BookOpen size={20} />
                  <span>Règles du vote</span>
                </button>
                
                <button 
                  onClick={() => {
                    logout();
                    window.location.href = '/';
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition text-red-400 w-full text-left"
                >
                  <LogOut size={20} />
                  <span>Changer de juge</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal des règles */}
      <AnimatePresence>
        {showRules && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRules(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:max-h-[80vh] bg-zinc-900 border border-white/10 rounded-3xl z-50 overflow-hidden flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                <h2 className="text-xl font-bold text-white">🎯 Comment bien voter ?</h2>
                <button
                  onClick={() => setShowRules(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition"
                >
                  <X size={20} className="text-white/70" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {RULES.map((rule, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-white/5 rounded-2xl border border-white/5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{rule.icon}</span>
                      <div>
                        <h3 className="font-semibold text-white mb-1">{rule.title}</h3>
                        <p className="text-sm text-white/60 leading-relaxed">{rule.text}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 border-t border-white/10 flex-shrink-0">
                <button
                  onClick={() => setShowRules(false)}
                  className="w-full py-3 bg-pink-600 hover:bg-pink-700 rounded-2xl font-semibold text-white transition-all"
                >
                  J'ai compris, je continue !
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
