import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const JUDGES_DIR = path.join(process.cwd(), 'data', 'judges');
const K_FACTOR = 32;

// Créer le dossier judges s'il n'existe pas
if (!fs.existsSync(JUDGES_DIR)) {
  fs.mkdirSync(JUDGES_DIR, { recursive: true });
}

function getJudgeFilePath(judgeId: string) {
  return path.join(JUDGES_DIR, `${judgeId}.json`);
}

function loadJudgeData(judgeId: string): any {
  const filePath = getJudgeFilePath(judgeId);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    console.error("Erreur chargement juge:", error);
  }
  return { judgeId, images: {}, total_votes: 0, last_updated: new Date().toISOString() };
}

function saveJudgeData(judgeId: string, data: any) {
  data.last_updated = new Date().toISOString();
  fs.writeFileSync(getJudgeFilePath(judgeId), JSON.stringify(data, null, 2), 'utf-8');
}

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function updateEloScores(eloData: any, winnerId: string, loserId: string, isDraw: boolean) {
  if (!eloData.images[winnerId]) eloData.images[winnerId] = { elo: 1200, votes: 0, wins: 0, losses: 0, draws: 0 };
  if (!eloData.images[loserId]) eloData.images[loserId] = { elo: 1200, votes: 0, wins: 0, losses: 0, draws: 0 };

  const playerA = eloData.images[winnerId];
  const playerB = eloData.images[loserId];

  playerA.votes += 1;
  playerB.votes += 1;

  if (isDraw) {
    playerA.draws += 1;
    playerB.draws += 1;
    const expectedA = expectedScore(playerA.elo, playerB.elo);
    const expectedB = expectedScore(playerB.elo, playerA.elo);
    playerA.elo += Math.round(K_FACTOR * (0.5 - expectedA));
    playerB.elo += Math.round(K_FACTOR * (0.5 - expectedB));
  } else {
    playerA.wins += 1;
    playerB.losses += 1;
    const expectedA = expectedScore(playerA.elo, playerB.elo);
    const expectedB = expectedScore(playerB.elo, playerA.elo);
    playerA.elo += Math.round(K_FACTOR * (1 - expectedA));
    playerB.elo += Math.round(K_FACTOR * (0 - expectedB));
  }

  eloData.total_votes += 1;
  return eloData;
}

// POST : Enregistrer un vote pour un juge spécifique
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { winnerId, loserId, winner, judgeId } = body;

    if (!winnerId || !loserId || !judgeId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    let eloData = loadJudgeData(judgeId);
    const isDraw = winner === 'draw';
    eloData = updateEloScores(eloData, winnerId, loserId, isDraw);
    saveJudgeData(judgeId, eloData);

    return NextResponse.json({ success: true, totalVotes: eloData.total_votes });
  } catch (error) {
    console.error("Erreur vote:", error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

// GET : Récupérer le classement d'un juge spécifique
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');

  if (!judgeId) {
    return NextResponse.json({ error: 'judgeId manquant' }, { status: 400 });
  }

  const eloData = loadJudgeData(judgeId);
  
  const allImages = Object.entries(eloData.images)
    .map(([id, data]: [string, any]) => ({ id, ...data }))
    .sort((a, b) => b.elo - a.elo);

  return NextResponse.json({
    totalVotes: eloData.total_votes,
    totalImages: Object.keys(eloData.images).length,
    images: allImages
  });
}
