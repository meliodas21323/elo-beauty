import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

const ADMIN_UUID = 'd8bf9451-284c-4927-bae2-f0910905f44e';

export async function POST(request: Request) {
  const { judgeId: adminId, judgeName, login, password } = await request.json();

  if (!adminId || adminId !== ADMIN_UUID) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!judgeName || !login || !password) {
    return NextResponse.json({ error: "Nom, identifiant et mot de passe requis" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Vérifier si le login existe déjà
  const { data: existingJudge } = await supabase
    .from('judges')
    .select('id')
    .eq('login', login.trim())
    .single();

  if (existingJudge) {
    return NextResponse.json({ error: "Cet identifiant existe déjà" }, { status: 409 });
  }

  // Hacher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insérer le nouveau juge
  const { data, error } = await supabase
    .from('judges')
    .insert({
      name: judgeName.trim(),
      login: login.trim(),
      password: hashedPassword,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur création juge:", error);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    judge: {
      id: data.id,
      name: data.name,
      login: data.login
    }
  });
}