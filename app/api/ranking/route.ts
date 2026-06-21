import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');

  if (!judgeId) {
    return NextResponse.json({ error: "judgeId manquant" }, { status: 400 });
  }

  const supabase = createServerClient();

  // 1. Récupérer TOUS les scores du juge avec .limit(2000) pour override la limite de 1000
  const { data: scores, error: scoresError } = await supabase
    .from('elo_scores')
    .select('image_id, elo, votes, wins, losses')
    .eq('judge_id', judgeId)
    .limit(2000);  // ✅ Override la limite par défaut de 1000

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

  let ranking = scores.map(score => ({
    id: score.image_id,
    url: imagesMap.get(score.image_id) || '',
    elo: score.elo,
    votes: score.votes,
    wins: score.wins,
    losses: score.losses
  }));

  // 4. TRI STRICT MULTI-CRITÈRES en JavaScript (plus fiable que .order() chaîné)
  ranking.sort((a, b) => {
    // Critère 1 : Elo décroissant
    if (b.elo !== a.elo) return b.elo - a.elo;
    
    // Critère 2 : Votes décroissant
    if (b.votes !== a.votes) return b.votes - a.votes;
    
    // Critère 3 : Ratio victoires/défaites
    const ratioA = a.votes > 0 ? a.wins / a.votes : 0;
    const ratioB = b.votes > 0 ? b.wins / b.votes : 0;
    if (ratioB !== ratioA) return ratioB - ratioA;
    
    // Critère 4 : ID d'image (ordre déterministe ultime)
    return a.id.localeCompare(b.id);
  });

  return NextResponse.json({ ranking });
}