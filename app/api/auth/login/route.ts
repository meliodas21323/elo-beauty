import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  const { login, password } = await request.json();

  if (!login || !password) {
    return NextResponse.json({ error: "Identifiant et mot de passe requis" }, { status: 400 });
  }

  const supabase = createServerClient();

  // On cherche un juge avec cet identifiant ET ce mot de passe
  const { data, error } = await supabase
    .from('judges')
    .select('id, name')
    .eq('login', login)
    .eq('password', password)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect" }, { status: 401 });
  }

  // Si c'est bon, on renvoie les infos du juge
  return NextResponse.json({ success: true, judge: data });
}
