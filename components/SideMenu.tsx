'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SideMenuProps {
  judgeName: string;
}

// UUID de Meliodas (seul admin autorisé)
const ADMIN_UUID = 'd8bf9451-284c-4927-bae2-f0910905f44e';

export default function SideMenu({ judgeName }: SideMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Vérifier l'admin APRÈS le chargement (côté client uniquement)
  useEffect(() => {
  const judgeId = localStorage.getItem('judgeId');
  alert(`judgeId: ${judgeId}\nADMIN_UUID: ${ADMIN_UUID}\nMatch: ${judgeId === ADMIN_UUID}`);
  setIsAdmin(judgeId === ADMIN_UUID);
}, []);

  const handleLogout = () => {
    localStorage.removeItem('judgeId');
    localStorage.removeItem('judgeName');
    router.push('/');
  };

  const navigate = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Bouton hamburger */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-4 hover:bg-zinc-800 rounded-xl transition-colors"
        aria-label="Menu"
      >
        <svg
          className="w-7 h-7 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay sombre */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu latéral avec safe area */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-zinc-900 border-r border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        {/* En-tête du menu */}
        <div className="px-6 pb-5 border-b border-zinc-800">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-pink-500">Menu</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-3 hover:bg-zinc-800 rounded-xl transition-colors"
              aria-label="Fermer"
            >
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-base text-zinc-400 mt-3">Juge : {judgeName}</p>
        </div>

        {/* Items du menu */}
        <nav className="p-5 space-y-3">
          <button
            onClick={() => navigate('/vote')}
            className="w-full text-left p-5 hover:bg-zinc-800 rounded-xl text-white transition-colors flex items-center gap-4 text-lg font-medium"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Voter
          </button>

          <button
            onClick={() => navigate('/classement')}
            className="w-full text-left p-5 hover:bg-zinc-800 rounded-xl text-white transition-colors flex items-center gap-4 text-lg font-medium"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Classement
          </button>

          <button
            onClick={() => navigate('/profil')}
            className="w-full text-left p-5 hover:bg-zinc-800 rounded-xl text-white transition-colors flex items-center gap-4 text-lg font-medium"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profil
          </button>

          <button
            onClick={() => navigate('/regles')}
            className="w-full text-left p-5 hover:bg-zinc-800 rounded-xl text-white transition-colors flex items-center gap-4 text-lg font-medium"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Règles
          </button>

          <button
            onClick={() => navigate('/parametres')}
            className="w-full text-left p-5 hover:bg-zinc-800 rounded-xl text-white transition-colors flex items-center gap-4 text-lg font-medium"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Paramètres
          </button>

          {/* Bouton Admin (visible uniquement par Meliodas) */}
          {isAdmin && (
            <>
              <div className="border-t border-zinc-800 my-5"></div>
              <button
                onClick={() => navigate('/admin')}
                className="w-full text-left p-5 hover:bg-pink-900/30 rounded-xl text-pink-400 transition-colors flex items-center gap-4 text-lg font-medium border border-pink-900/50"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard Admin
              </button>
            </>
          )}

          <div className="border-t border-zinc-800 my-5"></div>

          <button
            onClick={handleLogout}
            className="w-full text-left p-5 hover:bg-red-900/50 rounded-xl text-red-400 transition-colors flex items-center gap-4 text-lg font-medium"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </nav>
      </div>
    </>
  );
}