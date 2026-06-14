import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const K_FACTOR = 32;

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

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

  // 1. Enregistrer le vote
  const { data: winnerScore } = await supabase
    .from('elo_scores')
    .select('elo, votes, wins')
    .eq('judge_id', judgeId)
    .eq('image_id', winnerId)
    .single();

  const { data: loserScore } = await supabase
    .from('elo_scores')
    .select('elo, votes, losses')
    .eq('judge_id', judgeId)
    .eq('image_id', loserId)
    .single();

  const currentWinnerElo = winnerScore?.elo || 1200;
  const currentLoserElo = loserScore?.elo || 1200;
  const currentWinnerVotes = winnerScore?.votes || 0;
  const currentLoserVotes = loserScore?.votes || 0;
  const currentWinnerWins = winnerScore?.wins || 0;
  const currentLoserLosses = loserScore?.losses || 0;

  const { newRatingA: newWinnerElo, newRatingB: newLoserElo } = calculateElo(
    currentWinnerElo, currentLoserElo, 1
  );

  if (winnerScore) {
    await supabase.from('elo_scores').update({
      elo: newWinnerElo, votes: currentWinnerVotes + 1,
      wins: currentWinnerWins + 1, updated_at: new Date().toISOString()
    }).eq('judge_id', judgeId).eq('image_id', winnerId);
  } else {
    await supabase.from('elo_scores').insert({
      judge_id: judgeId, image_id: winnerId,
      elo: newWinnerElo, votes: 1, wins: 1
    });
  }

  if (loserScore) {
    await supabase.from('elo_scores').update({
      elo: newLoserElo, votes: currentLoserVotes + 1,
      losses: currentLoserLosses + 1, updated_at: new Date().toISOString()
    }).eq('judge_id', judgeId).eq('image_id', loserId);
  } else {
    await supabase.from('elo_scores').insert({
      judge_id: judgeId, image_id: loserId,
      elo: newLoserElo, votes: 1, losses: 1
    });
  }

  // 2. Charger la prochaine paire
  const { data: images } = await supabase
    .from('images')
    .select('id, cloudinary_url')
    .order('id');

  const { data: scores } = await supabase
    .from('elo_scores')
    .select('image_id, elo, votes')
    .eq('judge_id', judgeId);

  const scoresMap = new Map<string, { elo: number; votes: number }>();
  if (scores) {
    scores.forEach(s => scoresMap.set(s.image_id, { elo: s.elo, votes: s.votes }));
  }

  const imagesWithVotes = (images || []).map(img => ({
    id: img.id, url: img.cloudinary_url,
    votes: scoresMap.get(img.id)?.votes || 0,
    elo: scoresMap.get(img.id)?.elo || 1200
  }));

  imagesWithVotes.sort((a, b) => a.votes - b.votes);
  const topCount = Math.max(2, Math.floor(imagesWithVotes.length * 0.2));
  const candidates = imagesWithVotes.slice(0, topCount);
  const shuffled = candidates.sort(() => 0.5 - Math.random());

  const image1 = shuffled[0];
  let image2 = shuffled[1];

  if (!image2 || image1.id === image2.id) {
    const others = imagesWithVotes.filter(img => img.id !== image1.id);
    image2 = others[Math.floor(Math.random() * others.length)];
  }

  return NextResponse.json({
    success: true,
    newWinnerElo, newLoserElo,
    next: {
      left: { id: image1.id, url: image1.url, elo: image1.elo },
      right: { id: image2.id, url: image2.url, elo: image2.elo }
    }
  });
}