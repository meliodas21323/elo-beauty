import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');

  if (!judgeId) {
    return NextResponse.json({ error: "judgeId manquant" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Récupérer toutes les images
  const { data: images, error: imagesError } = await supabase
    .from('images')
    .select('id, cloudinary_url')
    .order('id');

  if (imagesError || !images || images.length < 2) {
    console.error("Erreur images:", imagesError);
    return NextResponse.json({ error: "Pas assez d'images" }, { status: 400 });
  }

  // Récupérer les scores Elo du juge
  const { data: scores, error: scoresError } = await supabase
    .from('elo_scores')
    .select('image_id, elo, votes')
    .eq('judge_id', judgeId);

  if (scoresError) {
    console.error("Erreur scores:", scoresError);
  }

  // Créer un map des scores
  const scoresMap = new Map<string, { elo: number; votes: number }>();
  if (scores) {
    scores.forEach(s => scoresMap.set(s.image_id, { elo: s.elo, votes: s.votes }));
  }

  // Ajouter les votes aux images
  const imagesWithVotes = images.map(img => ({
    id: img.id,
    url: img.cloudinary_url,
    votes: scoresMap.get(img.id)?.votes || 0,
    elo: scoresMap.get(img.id)?.elo || 1200
  }));

  // Trier par nombre de votes croissant (les moins votées d'abord)
  imagesWithVotes.sort((a, b) => a.votes - b.votes);

  // Prendre les 20% les moins votées
  const topCount = Math.max(2, Math.floor(imagesWithVotes.length * 0.2));
  const candidates = imagesWithVotes.slice(0, topCount);

  // Choisir 2 au hasard
  const shuffled = candidates.sort(() => 0.5 - Math.random());
  const image1 = shuffled[0];
  let image2 = shuffled[1];

  // Si pas assez de candidates, prendre n'importe quelle autre image
  if (!image2 || image1.id === image2.id) {
    const others = imagesWithVotes.filter(img => img.id !== image1.id);
    image2 = others[Math.floor(Math.random() * others.length)];
  }

  return NextResponse.json({
    left: { id: image1.id, url: image1.url, elo: image1.elo },
    right: { id: image2.id, url: image2.url, elo: image2.elo }
  });
}
