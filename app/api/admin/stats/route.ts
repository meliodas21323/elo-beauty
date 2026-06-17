import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// UUID de Meliodas (seul admin autorisé)
const ADMIN_UUID = 'd8bf9451-284c-4927-bae2-f0910905f44e';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');

  // Sécurité : vérifier que c'est bien Meliodas
  if (!judgeId || judgeId !== ADMIN_UUID) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const supabase = createServerClient();

  // 1. Récupérer tous les juges
  const { data: judges } = await supabase
    .from('judges')
    .select('id, name, created_at')
    .order('created_at', { ascending: true });

  // 2. Récupérer toutes les images
  const { data: images, count: imageCount } = await supabase
    .from('images')
    .select('id', { count: 'exact', head: true });

  // 3. Récupérer tous les scores Elo
  const { data: scores } = await supabase
    .from('elo_scores')
    .select('judge_id, image_id, elo, votes, wins, losses');

  if (!judges || !scores) {
    return NextResponse.json({ error: "Erreur de récupération" }, { status: 500 });
  }

  // Calculer les stats par juge
  const judgeStats = judges.map(judge => {
    const judgeScores = scores.filter(s => s.judge_id === judge.id);
    const totalVotes = judgeScores.reduce((sum, s) => sum + s.votes, 0);
    // Chaque duel = 2 votes (1 gagnant + 1 perdant), donc duels = totalVotes / 2
    const totalDuels = Math.floor(totalVotes / 2);
    return {
      id: judge.id,
      name: judge.name,
      created_at: judge.created_at,
      totalVotes,
      totalDuels,
      imagesVoted: judgeScores.length
    };
  });

  // Total global
  const totalGlobalVotes = scores.reduce((sum, s) => sum + s.votes, 0);
  const totalGlobalDuels = Math.floor(totalGlobalVotes / 2);

  // Calculer les "images débat" (variance Elo entre juges)
  const imageScoresMap = new Map<string, { elos: number[]; imageId: string }>();
  scores.forEach(s => {
    if (!imageScoresMap.has(s.image_id)) {
      imageScoresMap.set(s.image_id, { elos: [], imageId: s.image_id });
    }
    imageScoresMap.get(s.image_id)!.elos.push(s.elo);
  });

  const imageDebates = Array.from(imageScoresMap.values())
    .filter(img => img.elos.length >= 2) // Au moins 2 juges ont voté
    .map(img => {
      const mean = img.elos.reduce((a, b) => a + b, 0) / img.elos.length;
      const variance = img.elos.reduce((sum, elo) => sum + Math.pow(elo - mean, 2), 0) / img.elos.length;
      const stdDev = Math.sqrt(variance);
      return {
        imageId: img.imageId,
        judgeCount: img.elos.length,
        meanElo: Math.round(mean),
        stdDev: Math.round(stdDev),
        minElo: Math.min(...img.elos),
        maxElo: Math.max(...img.elos)
      };
    })
    .sort((a, b) => b.stdDev - a.stdDev)
    .slice(0, 10); // Top 10 images débat

  return NextResponse.json({
    overview: {
      totalJudges: judges.length,
      totalImages: imageCount || 0,
      totalDuels: totalGlobalDuels,
      totalVotes: totalGlobalVotes
    },
    judgeStats,
    debateImages: imageDebates
  });
}
