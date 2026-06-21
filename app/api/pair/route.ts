import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  console.log('🔥 API PAIR APPELÉE'); // 🔴 Log au début
  
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');
  const excludeIdsParam = searchParams.get('excludeIds');
  const excludeIds = excludeIdsParam ? excludeIdsParam.split(',') : [];

  if (!judgeId) {
    return NextResponse.json({ error: "judgeId manquant" }, { status: 400 });
  }

  const supabase = createServerClient();

  // 1. Récupérer TOUTES les images (avec .limit pour override 1000)
  const { data: images } = await supabase
    .from('images')
    .select('id, cloudinary_url')
    .limit(2000);

  // 2. Récupérer les scores du juge
  const { data: scores } = await supabase
    .from('elo_scores')
    .select('image_id, elo, votes')
    .eq('judge_id', judgeId);

  const scoresMap = new Map<string, { elo: number; votes: number }>();
  if (scores) {
    scores.forEach(s => scoresMap.set(s.image_id, { elo: s.elo, votes: s.votes }));
  }

  // 3. Créer la liste complète TOUTES les images, même sans score
  let imagesWithVotes = (images || []).map(img => ({
    id: img.id,
    url: img.cloudinary_url,
    votes: scoresMap.get(img.id)?.votes || 0,
    elo: scoresMap.get(img.id)?.elo || 1200
  }));

  // 4. Exclure les images récemment vues
  if (excludeIds.length > 0) {
    imagesWithVotes = imagesWithVotes.filter(img => !excludeIds.includes(img.id));
  }

  // 5. Trier par nombre de votes (les moins votées en premier)
  imagesWithVotes.sort((a, b) => a.votes - b.votes);
  
  // 6. Prendre le top 30% des moins votées
  const topCount = Math.max(20, Math.floor(imagesWithVotes.length * 0.3));
  const candidates = imagesWithVotes.slice(0, topCount);

  // 7. Créer les paires
  const pairs = [];
  for (let i = 0; i < 10; i++) {
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    const image1 = shuffled[0];
    let image2 = shuffled[1];
    if (!image2 || image1.id === image2.id) {
      const others = candidates.filter(img => img.id !== image1.id);
      image2 = others[Math.floor(Math.random() * others.length)];
    }
    pairs.push({
      left: { id: image1.id, url: image1.url, elo: image1.elo },
      right: { id: image2.id, url: image2.url, elo: image2.elo }
    });
  }

  // 🔍 LOGS DE DÉBOGAGE
  const imagesWithZeroVotes = imagesWithVotes.filter(img => img.votes === 0);
  const candidatesWithZeroVotes = candidates.filter(img => img.votes === 0);
  
  console.log('📊 DEBUG PAIR API:');
  console.log('Total images récupérées:', images?.length || 0);
  console.log('Images avec 0 vote (total):', imagesWithZeroVotes.length);
  console.log('Images avec score:', scores?.length || 0);
  console.log('TopCount (30%):', topCount);
  console.log('Candidats sélectionnés:', candidates.length);
  console.log('Candidats avec 0 vote:', candidatesWithZeroVotes.length);
  
  if (candidatesWithZeroVotes.length > 0) {
    console.log('Exemples d\'images 0 vote dans candidats:', 
      candidatesWithZeroVotes.slice(0, 5).map(img => img.id));
  }

  return NextResponse.json({ pairs });
}