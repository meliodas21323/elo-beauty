'use client';

import { useState } from 'react';
import { useJudge } from '../src/context/JudgeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, ArrowRight, BookOpen, X } from 'lucide-react';

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

export default function Home() {
  const { currentJudge, judges, setJudge, addJudge } = useJudge();
  const [newJudgeName, setNewJudgeName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showRules, setShowRules] = useState(false);

  if (currentJudge) {
    window.location.href = '/vote';
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Redirection vers le vote...</p>
        </div>
      </div>
    );
  }

  const handleCreateJudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (newJudgeName.trim()) {
      addJudge(newJudgeName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col">
      {/* Header */}
      <div className="pt-[env(safe-area-inset-top)] px-6 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 mb-6 shadow-2xl shadow-pink-500/30">
            <Heart className="text-white" size={40} fill="white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Elo Beauty</h1>
          <p className="text-white/60 text-sm">Classement collaboratif par système Elo</p>
        </motion.div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 px-6 pb-[env(safe-area-inset-bottom)]">
        {/* Bouton Règles */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => setShowRules(true)}
          className="w-full flex items-center justify-center gap-2 p-3 mb-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/80 transition-all"
        >
          <BookOpen size={18} />
          <span className="font-medium text-sm">Lire les règles du vote</span>
        </motion.button>

        {/* Liste des juges existants */}
        {judges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">
              Jugues existants
            </h2>
            <div className="space-y-3">
              {judges.map((judge) => (
                <motion.button
                  key={judge.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setJudge(judge)}
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 rounded-2xl transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {judge.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">{judge.name}</div>
                    <div className="text-xs text-white/40">
                      Créé le {new Date(judge.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <ArrowRight className="text-white/40 group-hover:text-pink-500 transition-colors" size={20} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bouton nouveau juge ou formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-3 p-4 bg-pink-600 hover:bg-pink-700 rounded-2xl font-semibold text-white transition-all shadow-lg shadow-pink-600/30"
            >
              <Plus size={20} />
              Nouveau juge
            </button>
          ) : (
            <form onSubmit={handleCreateJudge} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white/60 mb-2 block">
                  Ton prénom
                </label>
                <input
                  type="text"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  placeholder="Ex: Julien"
                  className="w-full p-4 bg-white/5 border border-white/20 focus:border-pink-500 rounded-2xl text-white placeholder-white/30 outline-none transition-colors"
                  autoFocus
                  maxLength={20}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setNewJudgeName('');
                  }}
                  className="flex-1 p-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl font-semibold text-white transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newJudgeName.trim()}
                  className="flex-1 p-4 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-semibold text-white transition-all shadow-lg shadow-pink-600/30"
                >
                  Commencer
                </button>
              </div>
            </form>
          )}
        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-white/30">
            {judges.length} juge{judges.length > 1 ? 's' : ''} enregistré{judges.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Modal des règles */}
      <AnimatePresence>
        {showRules && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRules(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:max-h-[80vh] bg-zinc-900 border border-white/10 rounded-3xl z-50 overflow-hidden flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {/* Header du modal */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                <h2 className="text-xl font-bold text-white">🎯 Comment bien voter ?</h2>
                <button
                  onClick={() => setShowRules(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition"
                >
                  <X size={20} className="text-white/70" />
                </button>
              </div>

              {/* Liste des règles */}
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

              {/* Bouton fermer en bas */}
              <div className="p-4 border-t border-white/10 flex-shrink-0">
                <button
                  onClick={() => setShowRules(false)}
                  className="w-full py-3 bg-pink-600 hover:bg-pink-700 rounded-2xl font-semibold text-white transition-all"
                >
                  J'ai compris, commençons !
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
