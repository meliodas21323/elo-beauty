'use client';

import { useState } from 'react';
import Image from 'next/image';

type ImagePair = {
  left: { id: string; url: string };
  right: { id: string; url: string };
};

export default function PairwiseVoter() {
  const [currentPair, setCurrentPair] = useState<ImagePair | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [voteCount, setVoteCount] = useState(0);

  const handleVote = async (winnerId: string, loserId: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          winnerId, 
          loserId,
          timestamp: new Date().toISOString()
        }),
      });
      
      if (response.ok) {
        setVoteCount(prev => prev + 1);
        fetchNextPair();
      } else {
        console.error('Erreur lors du vote');
        fetchNextPair(); 
      }
    } catch (error) {
      console.error("Erreur:", error);
      fetchNextPair();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNextPair = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/pair?t=${Date.now()}`);
      if (!response.ok) throw new Error('Échec du chargement');
      const data = await response.json();
      setCurrentPair(data);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentPair) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <button 
          onClick={fetchNextPair}
          disabled={isLoading}
          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          {isLoading ? 'Chargement...' : 'Commencer le classement'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 gap-6 w-full max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Laquelle préfères-tu ?</h2>
        <p className="text-gray-500">Vote #{voteCount + 1}</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-6 w-full">
        <button 
          onClick={() => handleVote(currentPair.left.id, currentPair.right.id)}
          disabled={isLoading}
          className="flex-1 relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl active:scale-95 transition-all border-4 border-transparent hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <Image 
            src={currentPair.left.url} 
            alt="Image de gauche" 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 45vw"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
              Choisir celle-ci
            </span>
          </div>
        </button>

        <button 
          onClick={() => handleVote(currentPair.right.id, currentPair.left.id)}
          disabled={isLoading}
          className="flex-1 relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl active:scale-95 transition-all border-4 border-transparent hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <Image 
            src={currentPair.right.url} 
            alt="Image de droite" 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 45vw"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
              Choisir celle-ci
            </span>
          </div>
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Chargement...</span>
        </div>
      )}
    </div>
  );
}
