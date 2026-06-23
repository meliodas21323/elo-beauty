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
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');

  if (!judgeId) {
    return NextResponse.json({ error: "judgeId manquant" }, { status: 400 });
  }

  const supabase = createServerClient();

  // 1. Récupérer TOUTES les images avec pagination
  const images = await fetchAllImages(supabase);
  console.log(' Total images récupérées:', images.length);

  // 2. Récupérer TOUTES les scores du juge avec pagination
  const scores = await fetchAllScores(supabase, judgeId);
  console.log('📊 Total scores récupérés:', scores.length);

  if (scores.length === 0) {
    return NextResponse.json({ ranking: [] });
  }

  // 3. Créer une Map des scores pour accès rapide
  const scoresMap = new Map<string, { elo: number; votes: number; wins: number; losses: number }>();
  scores.forEach(s => {
    scoresMap.set(s.image_id, {
      elo: s.elo,
      votes: s.votes,
      wins: s.wins,
      losses: s.losses
    });
  });

  // 4. Créer une Map des URLs
  const imagesMap = new Map(images.map(img => [img.id, img.cloudinary_url]));

  // 5. Construire le ranking avec TOUTES les images (même celles sans score)
  let ranking = images.map(img => ({
    id: img.id,
    url: imagesMap.get(img.id) || '',
    elo: scoresMap.get(img.id)?.elo || 1200,
    votes: scoresMap.get(img.id)?.votes || 0,
    wins: scoresMap.get(img.id)?.wins || 0,
    losses: scoresMap.get(img.id)?.losses || 0
  }));

  // 6. TRI STRICT MULTI-CRITÈRES
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

  console.log('📊 Ranking final:', ranking.length, 'images');
  console.log(' Top 3:', ranking.slice(0, 3).map(r => `${r.id} (Elo:${r.elo}, Votes:${r.votes})`));

  return NextResponse.json({ ranking });
}