import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');

  if (!judgeId) {
    return NextResponse.json({ error: "judgeId manquant" }, { status: 400 });
  }

  const supabase = createServerClient();

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
    id: img.id,
    url: img.cloudinary_url,
    votes: scoresMap.get(img.id)?.votes || 0,
    elo: scoresMap.get(img.id)?.elo || 1200
  }));

  imagesWithVotes.sort((a, b) => a.votes - b.votes);
  const topCount = Math.max(6, Math.floor(imagesWithVotes.length * 0.2));
  const candidates = imagesWithVotes.slice(0, topCount);

  // Générer 3 paires
  const pairs = [];
  for (let i = 0; i < 3; i++) {
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

  return NextResponse.json({ pairs });
}