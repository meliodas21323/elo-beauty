import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Fonction pour obtenir la date locale au format YYYY-MM-DD
function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function POST(request: Request) {
  const { judgeId } = await request.json();

  if (!judgeId) {
    return NextResponse.json({ error: "judgeId manquant" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Date du jour en heure LOCALE (pas UTC)
  const today = new Date();
  const todayStr = getLocalDateString(today);

  // Essayer d'insérer, ignorer si existe déjà
  const { error } = await supabase
    .from('login_history')
    .insert({ judge_id: judgeId, login_date: todayStr });

  // Ignorer l'erreur de doublon
  if (error && !error.message?.includes('duplicate')) {
    console.error("Erreur login history:", error);
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');

  if (!judgeId) {
    return NextResponse.json({ error: "judgeId manquant" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('login_history')
    .select('login_date')
    .eq('judge_id', judgeId)
    .order('login_date', { ascending: false });

  if (error) {
    console.error("Erreur récupération:", error);
    return NextResponse.json({ streak: 0 });
  }

  const uniqueDates = [...new Set(data?.map(d => d.login_date))].sort().reverse();

  let streak = 0;
  
  // Date du jour en heure LOCALE
  const today = new Date();
  const todayStr = getLocalDateString(today);

  for (let i = 0; i < uniqueDates.length; i++) {
    // Calculer la date attendue (aujourd'hui - i jours) en heure locale
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    const expectedStr = getLocalDateString(expectedDate);

    if (uniqueDates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return NextResponse.json({ streak });
}