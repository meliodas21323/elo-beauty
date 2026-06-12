import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Facteur K pour le calcul Elo
const K_FACTOR = 32;

// Calculer la probabilité de victoire
function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

// Calculer les nouveaux scores Elo
function calculateElo(ratingA: number, ratingB: number, scoreA: number): { newRatingA: number; newRatingB: number } {
  const expectedA = expectedScore(ratingA, ratingB);
  const expectedB = 1 - expectedA;
  
  const newRatingA = ratingA + K_FACTOR * (scoreA - expectedA);
  const newRatingB = ratingB + K_FACTOR * ((1 - scoreA) - expectedB);
  
  return { newRatingA: Math.round(newRatingA), newRatingB: Math.round(newRatingB) };
}

export async function POST(request: Request) {
  const body = await request.json();
  const { judgeId, winnerId, loserId } = body;

  if (!judgeId || !winnerId || !loserId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Récupérer ou créer le juge
  const { data: judge, error: judgeError } = await supabase
    .from('judges')
    .select('id')
    .eq('id', judgeId)
    .single();

  if (judgeError && judgeError.code === 'PGRST116') {
    // Juge n'existe pas, le créer
    const { data: newJudge, error: createError } = await supabase
      .from('judges')
      .insert({ id: judgeId, name: judgeId })
      .select()
      .single();
    
    if (createError) {
      console.error("Erreur création juge:", createError);
      return NextResponse.json({ error: "Erreur création juge" }, { status: 500 });
    }
  }

  // Récupérer les scores actuels
  const { data: winnerScore, error: winnerError } = await supabase
    .from('elo_scores')
    .select('elo, votes, wins')
    .eq('judge_id', judgeId)
    .eq('image_id', winnerId)
    .single();

  const { data: loserScore, error: loserError } = await supabase
    .from('elo_scores')
    .select('elo, votes, losses')
    .eq('judge_id', judgeId)
    .eq('image_id', loserId)
    .single();

  // Scores par défaut si n'existent pas
  const currentWinnerElo = winnerScore?.elo || 1200;
  const currentLoserElo = loserScore?.elo || 1200;
  const currentWinnerVotes = winnerScore?.votes || 0;
  const currentLoserVotes = loserScore?.votes || 0;
  const currentWinnerWins = winnerScore?.wins || 0;
  const currentLoserLosses = loserScore?.losses || 0;

  // Calculer les nouveaux scores
  const { newRatingA: newWinnerElo, newRatingB: newLoserElo } = calculateElo(
    currentWinnerElo,
    currentLoserElo,
    1 // winner a gagné
  );

  // Mettre à jour ou créer les scores
  if (winnerScore) {
    await supabase
      .from('elo_scores')
      .update({
        elo: newWinnerElo,
        votes: currentWinnerVotes + 1,
        wins: currentWinnerWins + 1,
        updated_at: new Date().toISOString()
      })
      .eq('judge_id', judgeId)
      .eq('image_id', winnerId);
  } else {
    await supabase
      .from('elo_scores')
      .insert({
        judge_id: judgeId,
        image_id: winnerId,
        elo: newWinnerElo,
        votes: 1,
        wins: 1
      });
  }

  if (loserScore) {
    await supabase
      .from('elo_scores')
      .update({
        elo: newLoserElo,
        votes: currentLoserVotes + 1,
        losses: currentLoserLosses + 1,
        updated_at: new Date().toISOString()
      })
      .eq('judge_id', judgeId)
      .eq('image_id', loserId);
  } else {
    await supabase
      .from('elo_scores')
      .insert({
        judge_id: judgeId,
        image_id: loserId,
        elo: newLoserElo,
        votes: 1,
        losses: 1
      });
  }

  return NextResponse.json({
    success: true,
    newWinnerElo,
    newLoserElo
  });
}
