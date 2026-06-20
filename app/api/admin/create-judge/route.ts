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

  const trimmedName = judgeName.trim();
  const trimmedLogin = login.trim();

  // Vérifier si le nom existe déjà
  const { data: existingName } = await supabase
    .from('judges')
    .select('id, name')
    .eq('name', trimmedName)
    .single();

  if (existingName) {
    return NextResponse.json({ 
      error: `Un juge nommé "${trimmedName}" existe déjà` 
    }, { status: 409 });
  }

  // Vérifier si le login existe déjà
  const { data: existingLogin } = await supabase
    .from('judges')
    .select('id, login')
    .eq('login', trimmedLogin)
    .single();

  if (existingLogin) {
    return NextResponse.json({ 
      error: `L'identifiant "${trimmedLogin}" est déjà utilisé` 
    }, { status: 409 });
  }

  // Hacher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insérer le nouveau juge
  const { data, error } = await supabase
    .from('judges')
    .insert({
      name: trimmedName,
      login: trimmedLogin,
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