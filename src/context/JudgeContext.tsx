'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Judge = {
  id: string;
  name: string;
  createdAt: string;
};

type JudgeContextType = {
  currentJudge: Judge | null;
  judges: Judge[];
  setJudge: (judge: Judge) => void;
  logout: () => void;
  addJudge: (name: string) => Judge;
};

const JudgeContext = createContext<JudgeContextType | undefined>(undefined);

const JUDGES_STORAGE_KEY = 'elo_beauty_judges';
const CURRENT_JUDGE_KEY = 'elo_beauty_current_judge';

export function JudgeProvider({ children }: { children: ReactNode }) {
  const [currentJudge, setCurrentJudge] = useState<Judge | null>(null);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger au démarrage
  useEffect(() => {
    try {
      const storedJudges = localStorage.getItem(JUDGES_STORAGE_KEY);
      const storedCurrent = localStorage.getItem(CURRENT_JUDGE_KEY);
      
      const judgesList: Judge[] = storedJudges ? JSON.parse(storedJudges) : [];
      setJudges(judgesList);
      
      if (storedCurrent) {
        const current: Judge = JSON.parse(storedCurrent);
        // Vérifier que le juge existe toujours
        if (judgesList.find(j => j.id === current.id)) {
          setCurrentJudge(current);
        }
      }
    } catch (error) {
      console.error("Erreur chargement juge:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setJudge = (judge: Judge) => {
    setCurrentJudge(judge);
    localStorage.setItem(CURRENT_JUDGE_KEY, JSON.stringify(judge));
  };

  const logout = () => {
    setCurrentJudge(null);
    localStorage.removeItem(CURRENT_JUDGE_KEY);
  };

  const addJudge = (name: string): Judge => {
    const newJudge: Judge = {
      id: `judge_${Date.now()}`,
      name: name.trim(),
      createdAt: new Date().toISOString()
    };
    
    const updatedJudges = [...judges, newJudge];
    setJudges(updatedJudges);
    localStorage.setItem(JUDGES_STORAGE_KEY, JSON.stringify(updatedJudges));
    setJudge(newJudge);
    
    return newJudge;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <JudgeContext.Provider value={{ currentJudge, judges, setJudge, logout, addJudge }}>
      {children}
    </JudgeContext.Provider>
  );
}

export function useJudge() {
  const context = useContext(JudgeContext);
  if (!context) {
    throw new Error('useJudge doit être utilisé dans un JudgeProvider');
  }
  return context;
}
