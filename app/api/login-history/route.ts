import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  const { judgeId } = await request.json();

  if (!judgeId) {
    return NextResponse.json({ error: "judgeId manquant" }, { status: 400 });
  }

  const supabase = createServerClient();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const { error } = await supabase
    .from('login_history')
    .insert({ judge_id: judgeId, login_date: todayStr });

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
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  for (let i = 0; i < uniqueDates.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    const expectedStr = expectedDate.toISOString().split('T')[0];

    if (uniqueDates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return NextResponse.json({ streak });
}