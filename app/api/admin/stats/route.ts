import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Fonction générique pour récupérer TOUTES les lignes (pagination automatique)
async function fetchAll(supabase: any, table: string, columns: string, orderBy?: { column: string, ascending: boolean }) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let currentPage = 0;
  let hasMore = true;

  while (hasMore) {
    const start = currentPage * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    let query = supabase.from(table).select(columns).range(start, end);
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Erreur page ${currentPage} sur ${table}:`, error);
      break;
    }

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      if (data.length < PAGE_SIZE) hasMore = false;
    } else {
      hasMore = false;
    }
    currentPage++;
  }
  return allData;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get('adminKey');
  const judgeId = searchParams.get('judgeId');

  const SECRET = process.env.ADMIN_SECRET_KEY;
  if (!adminKey || adminKey !== SECRET) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!judgeId || judgeId !== 'd8bf9451-284c-4927-bae2-f0910905f44e') {
    return NextResponse.json({ error: "Utilisateur non autorisé" }, { status: 403 });
  }

  const supabase = createServerClient();

  // 1. Récupérer TOUTES les données avec pagination (plus de limite de 1000)
  const judges = await fetchAll(supabase, 'judges', 'id, name, login, created_at', { column: 'created_at', ascending: true });
  const scores = await fetchAll(supabase, 'elo_scores', 'judge_id, image_id, elo, votes, wins, losses');
  const allVotes = await fetchAll(supabase, 'votes', 'judge_id, winner_id, loser_id, created_at', { column: 'created_at', ascending: true });
  
  const { data: images, count: imageCount } = await supabase.from('images').select('id, cloudinary_url').range(0, 2000);

  if (!judges || !scores) {
    return NextResponse.json({ error: "Erreur de récupération" }, { status: 500 });
  }

  console.log('📊 Admin Stats: Juges trouvés:', judges.length);

  const imageMap = new Map<string, string>();
  images?.forEach(img => imageMap.set(img.id, img.cloudinary_url));

  const judgeStats = judges.map(judge => {
    const judgeScores = scores.filter(s => s.judge_id === judge.id);
    const totalVotes = judgeScores.reduce((sum, s) => sum + (s.votes || 0), 0);
    const totalDuels = Math.floor(totalVotes / 2);

    const judgeVotes = allVotes.filter(v => v.judge_id === judge.id);
    let incoherenceCount = 0;
    let totalComparisons = 0;
    const cycles: any[] = [];

    // Optimisation : on limite la vérification des cycles aux 500 derniers votes pour éviter de freezer le serveur
    const recentVotes = judgeVotes.slice(-500); 
    
    for (let i = 0; i < recentVotes.length; i++) {
      for (let j = 0; j < recentVotes.length; j++) {
        if (i === j) continue;
        const v1 = recentVotes[i];
        const v2 = recentVotes[j];
        if (v1.loser_id === v2.winner_id) {
          totalComparisons++;
          const hasCA = recentVotes.some(v => v.winner_id === v2.loser_id && v.loser_id === v1.winner_id);
          if (hasCA) {
            incoherenceCount++;
            cycles.push({ A: v1.winner_id, B: v1.loser_id, C: v2.loser_id, date: v2.created_at });
          }
        }
      }
    }

    const coherenceRate = totalComparisons > 0 ? Math.round(((totalComparisons - incoherenceCount) / totalComparisons) * 100) : 100;

    const votesByDay: Record<string, number> = {};
    judgeVotes.forEach(v => {
      const day = new Date(v.created_at).toISOString().split('T')[0];
      votesByDay[day] = (votesByDay[day] || 0) + 1;
    });

    const dailyVotes = Object.entries(votesByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    return {
      id: judge.id, 
      name: judge.name, 
      login: judge.login,
      created_at: judge.created_at,
      totalVotes, 
      totalDuels, 
      imagesVoted: judgeScores.length,
      coherenceRate, 
      incoherenceCount, 
      cycles: cycles.slice(0, 10), 
      dailyVotes
    };
  });

  const totalGlobalVotes = scores.reduce((sum, s) => sum + (s.votes || 0), 0);
  const totalGlobalDuels = Math.floor(totalGlobalVotes / 2);

  const imageScoresMap = new Map<string, { elos: number[]; imageId: string; url: string }>();
  scores.forEach(s => {
    if (!imageScoresMap.has(s.image_id)) {
      imageScoresMap.set(s.image_id, { elos: [], imageId: s.image_id, url: imageMap.get(s.image_id) || '' });
    }
    imageScoresMap.get(s.image_id)!.elos.push(s.elo);
  });

  const imageDebates = Array.from(imageScoresMap.values())
    .filter(img => img.elos.length >= 2)
    .map(img => {
      const mean = img.elos.reduce((a, b) => a + b, 0) / img.elos.length;
      const variance = img.elos.reduce((sum, elo) => sum + Math.pow(elo - mean, 2), 0) / img.elos.length;
      return {
        imageId: img.imageId, url: img.url, judgeCount: img.elos.length,
        meanElo: Math.round(mean), stdDev: Math.round(Math.sqrt(variance)),
        minElo: Math.min(...img.elos), maxElo: Math.max(...img.elos)
      };
    })
    .sort((a, b) => b.stdDev - a.stdDev)
    .slice(0, 10);

  // 🔥 FORCER LE NO-CACHE pour que le téléphone affiche toujours les données à jour
  return NextResponse.json({
    overview: { totalJudges: judges.length, totalImages: imageCount || 0, totalDuels: totalGlobalDuels, totalVotes: totalGlobalVotes },
    judgeStats, debateImages: imageDebates
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate'
    }
  });
}