'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_UUID = 'd8bf9451-284c-4927-bae2-f0910905f44e';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const [showDebateImage, setShowDebateImage] = useState<any>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [showCreateJudgeModal, setShowCreateJudgeModal] = useState(false);
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeLogin, setNewJudgeLogin] = useState('');
  const [newJudgePassword, setNewJudgePassword] = useState('');
  const [creatingJudge, setCreatingJudge] = useState(false);

  useEffect(() => {
    const judgeId = localStorage.getItem('judgeId');
    if (!judgeId || judgeId !== ADMIN_UUID) {
      router.push('/');
      return;
    }
    const savedKey = sessionStorage.getItem('adminKey');
    if (savedKey) {
      verifyAdmin(savedKey, judgeId);
    } else {
      setLoading(false);
    }
  }, [router]);

  const verifyAdmin = async (key: string, judgeId: string) => {
    setLoading(true);
    setLoginError('');
    try {
      const res = await fetch(`/api/admin/stats?adminKey=${encodeURIComponent(key)}&judgeId=${judgeId}`, {
        cache: 'no-store' // 🔥 Force le rafraîchissement depuis le serveur
      });
      if (!res.ok) throw new Error('Mot de passe incorrect');
      const json = await res.json();
      console.log('📊 Données reçues:', json.overview.totalJudges, 'juges');
      setData(json);
      setIsAuthenticated(true);
      sessionStorage.setItem('adminKey', key);
    } catch (err: any) {
      setLoginError(err.message);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const judgeId = localStorage.getItem('judgeId');
    if (judgeId) verifyAdmin(adminPassword, judgeId);
  };

  const handleCreateJudge = async () => {
    if (!newJudgeName.trim() || !newJudgeLogin.trim() || !newJudgePassword) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setCreatingJudge(true);
    try {
      const res = await fetch('/api/admin/create-judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judgeId: localStorage.getItem('judgeId'),
          judgeName: newJudgeName,
          login: newJudgeLogin,
          password: newJudgePassword
        })
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Erreur création');

      alert(`Juge créé avec succès !\nNom: ${result.judge.name}\nIdentifiant: ${result.judge.login}`);

      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création du juge');
    } finally {
      setCreatingJudge(false);
      setShowCreateJudgeModal(false);
      setNewJudgeName('');
      setNewJudgeLogin('');
      setNewJudgePassword('');
    }
  };

  if (!loading && !isAuthenticated) {
    return (
      <div className="h-dvh bg-black text-white flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔒</div>
            <h1 className="text-2xl font-bold text-pink-500">Accès Administrateur</h1>
            <p className="text-zinc-400 text-sm mt-2">Entrez le mot de passe secret pour accéder au dashboard.</p>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 mb-4 focus:outline-none focus:border-pink-500"
              autoFocus
            />
            {loginError && <p className="text-red-400 text-sm mb-4 text-center">{loginError}</p>}
            <button
              type="submit"
              className="w-full px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors font-medium"
            >
              Déverrouiller
            </button>
          </form>
          <button onClick={() => router.push('/')} className="w-full mt-3 text-zinc-500 hover:text-white text-sm">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-dvh bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-dvh bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Erreur</h1>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-pink-600 text-white rounded-lg">Retour</button>
        </div>
      </div>
    );
  }

  if (showDebateImage) {
    return (
      <div className="h-dvh bg-black text-white flex flex-col">
        <header className="bg-black border-b border-zinc-800 px-4 py-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <div className="flex justify-between items-center">
            <button onClick={() => setShowDebateImage(null)} className="text-zinc-400 hover:text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Retour
            </button>
            <h1 className="text-xl font-bold text-pink-500">Image Débat</h1>
            <div className="w-20"></div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <img src={showDebateImage.url} alt="Image débat" className="w-full rounded-xl mb-4" />
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between"><span className="text-zinc-400">ID:</span><span className="text-zinc-300 font-mono text-sm">{showDebateImage.imageId.slice(0, 8)}...</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Juges:</span><span className="text-white font-bold">{showDebateImage.judgeCount}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Écart-type:</span><span className="text-orange-400 font-bold">{showDebateImage.stdDev}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Elo moyen:</span><span className="text-white font-bold">{showDebateImage.meanElo}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Min / Max:</span><span className="text-white"><span className="text-green-400">{showDebateImage.minElo}</span> / <span className="text-red-400">{showDebateImage.maxElo}</span></span></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <header className="bg-black border-b border-zinc-800 px-4 py-3 sticky top-0 z-10" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex justify-between items-center">
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl font-bold text-pink-500">Dashboard Admin</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><span className="text-pink-500">📊</span> Vue d'ensemble</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><div className="text-3xl font-bold text-pink-500">{data.overview.totalJudges}</div><div className="text-xs text-zinc-400 mt-1">Juges inscrits</div></div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><div className="text-3xl font-bold text-pink-500">{data.overview.totalImages}</div><div className="text-xs text-zinc-400 mt-1">Images</div></div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><div className="text-3xl font-bold text-pink-500">{data.overview.totalDuels.toLocaleString()}</div><div className="text-xs text-zinc-400 mt-1">Duels totaux</div></div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><div className="text-3xl font-bold text-pink-500">{data.overview.totalVotes.toLocaleString()}</div><div className="text-xs text-zinc-400 mt-1">Votes individuels</div></div>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><span className="text-pink-500">👥</span> Activité par juge</h2>
            <button onClick={() => setShowCreateJudgeModal(true)} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Créer un juge
            </button>
          </div>

          <div className="space-y-4">
            {data.judgeStats.map((judge: any) => (
              <div key={judge.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-white text-lg">{judge.name}</div>
                    <div className="text-xs text-zinc-500">Inscrit le {new Date(judge.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                  {judge.id === ADMIN_UUID && <span className="text-xs bg-pink-600/20 text-pink-400 px-2 py-1 rounded-full">Admin</span>}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center mb-4">
                  <div className="bg-zinc-800 rounded-lg py-2"><div className="text-lg font-bold text-white">{judge.totalDuels}</div><div className="text-xs text-zinc-400">Duels</div></div>
                  <div className="bg-zinc-800 rounded-lg py-2"><div className="text-lg font-bold text-white">{judge.totalVotes}</div><div className="text-xs text-zinc-400">Votes</div></div>
                  <div className={`rounded-lg py-2 ${judge.coherenceRate >= 90 ? 'bg-green-900/30' : judge.coherenceRate >= 70 ? 'bg-yellow-900/30' : 'bg-red-900/30'}`}>
                    <div className={`text-lg font-bold ${judge.coherenceRate >= 90 ? 'text-green-400' : judge.coherenceRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{judge.coherenceRate}%</div>
                    <div className="text-xs text-zinc-400">Cohérence</div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg py-2"><div className="text-lg font-bold text-red-400">{judge.incoherenceCount}</div><div className="text-xs text-zinc-400">Cycles</div></div>
                </div>

                {judge.dailyVotes && judge.dailyVotes.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-zinc-500 mb-2">Votes par jour (14 derniers jours)</div>
                    <div className="flex items-end gap-1 h-16 bg-zinc-800/50 rounded-lg p-2">
                      {(() => {
                        const maxVotes = Math.max(...judge.dailyVotes.map((d: any) => d.count));
                        return judge.dailyVotes.map((day: any, idx: number) => {
                          const height = maxVotes > 0 ? (day.count / maxVotes) * 100 : 0;
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-pink-600 rounded-t transition-all hover:bg-pink-400" style={{ height: `${Math.max(height, 5)}%` }} title={`${day.date}: ${day.count} votes`} />
                              <div className="text-[10px] text-zinc-500">{day.date.slice(8)}</div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {judge.cycles && judge.cycles.length > 0 && (
                  <div className="border-t border-zinc-800 pt-3">
                    <div className="text-xs text-red-400 font-bold mb-2">⚠️ Cycles détectés ({judge.cycles.length})</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {judge.cycles.map((cycle: any, idx: number) => (
                        <div key={idx} className="text-xs text-zinc-400 bg-zinc-800/50 p-2 rounded">
                          {cycle.A.slice(0, 4)} &gt; {cycle.B.slice(0, 4)} &gt; {cycle.C.slice(0, 4)} mais {cycle.C.slice(0, 4)} &gt; {cycle.A.slice(0, 4)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><span className="text-pink-500">🔥</span> Images qui font débat <span className="text-xs text-zinc-500 font-normal ml-auto">Top 10</span></h2>
          {data.debateImages.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-zinc-400">Pas encore assez de données</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {data.debateImages.map((img: any, index: number) => (
                <button key={img.imageId} onClick={() => setShowDebateImage(img)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-left hover:border-pink-600 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-pink-500 font-bold">#{index + 1}</span>
                    <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-0.5 rounded-full">σ: {img.stdDev}</span>
                  </div>
                  <div className="aspect-square bg-zinc-800 rounded-lg mb-2 overflow-hidden">
                    {img.url && <img src={img.url} alt="Débat" className="w-full h-full object-cover" />}
                  </div>
                  <div className="text-xs text-zinc-400">{img.judgeCount} juges • Elo: {img.minElo}-{img.maxElo}</div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {showCreateJudgeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Créer un nouveau juge</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Nom du juge</label>
                <input
                  type="text"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Identifiant (login)</label>
                <input
                  type="text"
                  value={newJudgeLogin}
                  onChange={(e) => setNewJudgeLogin(e.target.value)}
                  placeholder="Ex: jean"
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={newJudgePassword}
                  onChange={(e) => setNewJudgePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateJudgeModal(false);
                  setNewJudgeName('');
                  setNewJudgeLogin('');
                  setNewJudgePassword('');
                }}
                className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
                disabled={creatingJudge}
              >
                Annuler
              </button>
              <button
                onClick={handleCreateJudge}
                className="flex-1 px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                disabled={creatingJudge || !newJudgeName.trim() || !newJudgeLogin.trim() || !newJudgePassword}
              >
                {creatingJudge ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}