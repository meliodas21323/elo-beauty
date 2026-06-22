import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { login, password } = await request.json();

  if (!login || !password) {
    return NextResponse.json({ error: "Identifiant et mot de passe requis" }, { status: 400 });
  }

  const supabase = createServerClient();

  // 1. Récupérer le juge par son login
  const { data: judge, error } = await supabase
    .from('judges')
    .select('id, name, login, password')
    .eq('login', login)
    .single();

  if (error || !judge) {
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect" }, { status: 401 });
  }

  // 2. Comparer le mot de passe avec le hash bcrypt
  const passwordMatch = await bcrypt.compare(password, judge.password);

  if (!passwordMatch) {
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect" }, { status: 401 });
  }

  // 3. Si c'est bon, renvoyer les infos du juge (sans le mot de passe)
  return NextResponse.json({ 
    success: true, 
    judge: { id: judge.id, name: judge.name } 
  });
}