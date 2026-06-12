import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MAPPING_FILE = path.join(process.cwd(), 'data', 'cloudinary_mapping.json');
const JUDGES_DIR = path.join(process.cwd(), 'data', 'judges');

let cachedMapping: Record<string, string> = {};

function loadMapping(): Record<string, string> {
  if (Object.keys(cachedMapping).length > 0) return cachedMapping;
  try {
    const data = fs.readFileSync(MAPPING_FILE, 'utf-8');
    cachedMapping = JSON.parse(data) as Record<string, string>;
    return cachedMapping;
  } catch (error) {
    console.error("Erreur chargement mapping Cloudinary:", error);
    return {};
  }
}

function loadJudgeData(judgeId: string): any {
  const filePath = path.join(JUDGES_DIR, `${judgeId}.json`);
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {}
  return { images: {} };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');

  if (!judgeId) {
    return NextResponse.json({ error: "judgeId manquant" }, { status: 400 });
  }

  const mapping = loadMapping();
  const images = Object.entries(mapping).map(([filename, url]) => ({ id: filename, url }));
  const judgeData = loadJudgeData(judgeId);

  if (images.length < 2) {
    return NextResponse.json({ error: "Pas assez d'images" }, { status: 400 });
  }

  const imagesWithVotes = images.map(img => ({
    ...img,
    votes: judgeData.images[img.id]?.votes || 0,
  }));

  imagesWithVotes.sort((a, b) => a.votes - b.votes);

  const topCount = Math.max(2, Math.floor(imagesWithVotes.length * 0.2));
  const candidates = imagesWithVotes.slice(0, topCount);

  const shuffled = candidates.sort(() => 0.5 - Math.random());
    const image1 = shuffled[0];
  let image2: any = shuffled[1]; // ✅ Correction : type any

  if (!image2 || image1.id === image2.id) {
    const others = images.filter(img => img.id !== image1.id);
    image2 = others[Math.floor(Math.random() * others.length)];
  }

  return NextResponse.json({
    left: { id: image1.id, url: image1.url, elo: judgeData.images[image1.id]?.elo || 1200 },
    right: { id: image2.id, url: image2.url, elo: judgeData.images[image2.id]?.elo || 1200 }
  });
}
