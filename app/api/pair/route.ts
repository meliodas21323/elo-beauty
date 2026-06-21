import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  console.log('🔥 API PAIR APPELÉE - URL:', request.url);
  
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');

  if (!judgeId) {
    return NextResponse.json({ error: "judgeId manquant" }, { status: 400 });
  }

  const supabase = createServerClient();

  // 1. Récupérer TOUTES les images
  const { data: images } = await supabase
    .from('images')
    .select('id, cloudinary_url')
    .limit(2000);

  console.log('📊 Total images:', images?.length);

  // 2. Récupérer les scores du juge
  const { data: scores } = await supabase
    .from('elo_scores')
    .select('image_id, votes')
    .eq('judge_id', judgeId);

  const votedImageIds = new Set(scores?.map(s => s.image_id) || []);
  console.log('📊 Images déjà votées:', votedImageIds.size);

  // 3. SÉPARER les images votées et non votées
  const nonVotedImages = (images || []).filter(img => !votedImageIds.has(img.id));
  const votedImages = (images || []).filter(img => votedImageIds.has(img.id));

  console.log('📊 Images NON votées:', nonVotedImages.length);
  console.log('📊 Images votées:', votedImages.length);

  // 4. PRIORITÉ ABSOLUE aux images non votées
  let pool = [];
  if (nonVotedImages.length >= 2) {
    pool = nonVotedImages;
    console.log('✅ Utilisation des images NON votées');
  } else {
    pool = [...nonVotedImages, ...votedImages];
    console.log('⚠️ Mélange des images');
  }

  // 5. Créer les paires
  const pairs = [];
  for (let i = 0; i < 10; i++) {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const image1 = shuffled[0];
    const image2 = shuffled[1];
    
    if (image1 && image2) {
      pairs.push({
        left: { id: image1.id, url: image1.cloudinary_url, elo: 1200 },
        right: { id: image2.id, url: image2.cloudinary_url, elo: 1200 }
      });
    }
  }

  console.log('✅ Paires générées:', pairs.length);
  if (pairs.length > 0) {
    console.log('🎯 Première paire:', pairs[0].left.id, 'vs', pairs[0].right.id);
  }

  return NextResponse.json({ pairs });
}