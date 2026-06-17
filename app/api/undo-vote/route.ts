import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const K_FACTOR = 32;

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export async function POST(request: Request) {
  const { judgeId, winnerId, loserId } = await request.json();

  if (!judgeId || !winnerId || !loserId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const supabase = createServerClient();

  // 1. Récupérer les scores ACTUELS (après le vote qu'on veut annuler)
  const { data: winnerData } = await supabase
    .from('elo_scores')
    .select('elo, votes, wins')
    .eq('judge_id', judgeId)
    .eq('image_id', winnerId)
    .single();

  const { data: loserData } = await supabase
    .from('elo_scores')
    .select('elo, votes, losses')
    .eq('judge_id', judgeId)
    .eq('image_id', loserId)
    .single();

  if (!winnerData || !loserData || winnerData.votes <= 0) {
    return NextResponse.json({ error: "Vote introuvable ou déjà annulé" }, { status: 404 });
  }

  const currentWinnerElo = winnerData.elo;
  const currentLoserElo = loserData.elo;

  // 2. Calculer l'Elo PRÉCÉDENT (avant le vote)
  // Le vote a ajouté : K * (1 - expected) au gagnant. On le soustrait.
  const expectedWinner = expectedScore(currentWinnerElo, currentLoserElo);
  const expectedLoser = expectedScore(currentLoserElo, currentWinnerElo);

  const previousWinnerElo = currentWinnerElo - (K_FACTOR * (1 - expectedWinner));
  const previousLoserElo = currentLoserElo - (K_FACTOR * (0 - expectedLoser));

  // 3. Mettre à jour la base de données
  await supabase.from('elo_scores').update({
    elo: Math.round(previousWinnerElo),
    votes: winnerData.votes - 1,
    wins: winnerData.wins - 1,
    updated_at: new Date().toISOString()
  }).eq('judge_id', judgeId).eq('image_id', winnerId);

  await supabase.from('elo_scores').update({
    elo: Math.round(previousLoserElo),
    votes: loserData.votes - 1,
    losses: loserData.losses - 1,
    updated_at: new Date().toISOString()
  }).eq('judge_id', judgeId).eq('image_id', loserId);

  return NextResponse.json({ success: true });
}
