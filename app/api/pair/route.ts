import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Fonction générique pour récupérer TOUTES les images (pagination automatique)
async function fetchAllImages(supabase: any) {
  const PAGE_SIZE = 1000;
  let allImages: any[] = [];
  let currentPage = 0;
  let hasMore = true;

  while (hasMore) {
    const start = currentPage * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('images')
      .select('id, cloudinary_url')
      .range(start, end);

    if (error) {
      console.error(`Erreur page ${currentPage}:`, error);
      break;
    }

    if (data && data.length > 0) {
      allImages = [...allImages, ...data];
      if (data.length < PAGE_SIZE) hasMore = false;
    } else {
      hasMore = false;
    }
    currentPage++;
  }
  return allImages;
}

// Fonction générique pour récupérer TOUTES les scores (pagination automatique)
async function fetchAllScores(supabase: any, judgeId: string) {
  const PAGE_SIZE = 1000;
  let allScores: any[] = [];
  let currentPage = 0;
  let hasMore = true;

  while (hasMore) {
    const start = currentPage * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('elo_scores')
      .select('image_id, elo, votes, wins, losses')
      .eq('judge_id', judgeId)
      .range(start, end);

    if (error) {
      console.error(`Erreur scores page ${currentPage}:`, error);
      break;
    }

    if (data && data.length > 0) {
      allScores = [...allScores, ...data];
      if (data.length < PAGE_SIZE) hasMore = false;
    } else {
      hasMore = false;
    }
    currentPage++;
  }
  return allScores;
}

export async function GET(request: Request) {
  console.log('🔥 API PAIR APPELÉE');
  
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');
  const excludeIdsParam = searchParams.get('excludeIds');
  const excludeIds = excludeIdsParam ? excludeIdsParam.split(',') : [];

  if (!judgeId) {
    return NextResponse.json({ error: "judgeId manquant" }, { status: 400 });
  }

  const supabase = createServerClient();

  // 1. Récupérer TOUTES les images avec pagination
  const images = await fetchAllImages(supabase);
  console.log('📊 Total images récupérées:', images.length);

  // 2. Récupérer TOUTES les scores du juge avec pagination
  const scores = await fetchAllScores(supabase, judgeId);
  console.log('📊 Total scores récupérés:', scores.length);

  // 3. Créer une Map des scores
  const scoresMap = new Map<string, { elo: number; votes: number; wins: number; losses: number }>();
  if (scores) {
    scores.forEach(s => {
      scoresMap.set(s.image_id, {
        elo: s.elo,
        votes: s.votes,
        wins: s.wins,
        losses: s.losses
      });
    });
  }

  // 4. Créer la liste complète avec nombre de votes
  let imagesWithVotes = images.map(img => ({
    id: img.id,
    url: img.cloudinary_url,
    votes: scoresMap.get(img.id)?.votes || 0,
    elo: scoresMap.get(img.id)?.elo || 1200
  }));

  // 5. Exclure les images récemment vues
  imagesWithVotes = imagesWithVotes.filter(img => !excludeIds.includes(img.id));

  // 6. TRIER par nombre de votes (CROISSANT = les moins votées en premier)
  imagesWithVotes.sort((a, b) => a.votes - b.votes);

  // 7. Prendre un POOL LARGE (50 images) pour avoir de la variété
  const POOL_SIZE = 50;
  const pool = imagesWithVotes.slice(0, POOL_SIZE);

  // 8. MÉLANGER le pool pour éviter les mêmes paires
  pool.sort(() => 0.5 - Math.random());

  console.log('📊 Pool:', pool.length, 'images (50 moins votées, mélangées)');
  console.log('📊 Votes min/max dans le pool:', pool[0]?.votes, '-', pool[pool.length - 1]?.votes);

  // 9. Créer les paires à partir du pool mélangé
  const pairs = [];
  for (let i = 0; i < Math.floor(pool.length / 2); i++) {
    const image1 = pool[i * 2];
    const image2 = pool[i * 2 + 1];
    
    if (image1 && image2 && image1.id !== image2.id) {
      pairs.push({
        left: { id: image1.id, url: image1.url, elo: image1.elo },
        right: { id: image2.id, url: image2.url, elo: image2.elo }
      });
    }
  }

  console.log('✅ Paires générées:', pairs.length);
  if (pairs.length > 0) {
    console.log('🎯 Première paire:', pairs[0].left.id, `(v:${scoresMap.get(pairs[0].left.id)?.votes || 0})`, 'vs', pairs[0].right.id);
  }

  return NextResponse.json({ pairs });
}