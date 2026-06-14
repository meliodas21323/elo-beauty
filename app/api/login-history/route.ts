import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function POST(request: Request) {
  const { judgeId, loginDate } = await request.json();

  if (!judgeId || !loginDate) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const supabase = createServerClient();

  // On utilise la date envoyée par l'iPhone
  const { error } = await supabase
    .from('login_history')
    .insert({ judge_id: judgeId, login_date: loginDate });

  if (error && !error.message?.includes('duplicate')) {
    console.error("Erreur login history:", error);
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');
  const todayParam = searchParams.get('today'); // La date "aujourd'hui" envoyée par l'iPhone

  if (!judgeId || !todayParam) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
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
  
  // On crée une date à partir de la chaîne envoyée par l'iPhone
  const today = new Date(todayParam + 'T00:00:00');

  for (let i = 0; i < uniqueDates.length; i++) {
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