import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');

  if (!judgeId) {
    return NextResponse.json({ error: "judgeId manquant" }, { status: 400 });
  }

  const supabase = createServerClient();

  // 1. Récupérer les scores du juge avec TRI MULTI-CRITÈRES côté base de données
  const { data: scores, error: scoresError } = await supabase
    .from('elo_scores')
    .select('image_id, elo, votes, wins, losses')
    .eq('judge_id', judgeId)
    .range(0, 2000)
    .order('elo', { ascending: false })        // Critère 1 : Elo décroissant
    .order('votes', { ascending: false })      // Critère 2 : Votes décroissant
    .order('image_id', { ascending: true });   // Critère 3 : ID croissant (déterministe)

  if (scoresError) {
    console.error("Erreur scores:", scoresError);
    return NextResponse.json({ error: "Erreur de récupération" }, { status: 500 });
  }

  if (!scores || scores.length === 0) {
    return NextResponse.json({ ranking: [] });
  }

  // 2. Récupérer les URLs des images correspondantes
  const imageIds = scores.map(s => s.image_id);
  const { data: images, error: imagesError } = await supabase
    .from('images')
    .select('id, cloudinary_url')
    .in('id', imageIds);

  if (imagesError) {
    console.error("Erreur images:", imagesError);
  }

  // 3. Combiner les scores et les URLs
  const imagesMap = new Map(images?.map(img => [img.id, img.cloudinary_url]));

  const ranking = scores.map(score => ({
    id: score.image_id,
    url: imagesMap.get(score.image_id) || '',
    elo: score.elo,
    votes: score.votes,
    wins: score.wins,
    losses: score.losses
  }));

  return NextResponse.json({ ranking });
}