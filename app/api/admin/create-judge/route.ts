import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const ADMIN_UUID = 'd8bf9451-284c-4927-bae2-f0910905f44e';

export async function POST(request: Request) {
  const { judgeId: adminId, judgeName } = await request.json();

  // Sécurité : vérifier que c'est bien Meliodas
  if (!adminId || adminId !== ADMIN_UUID) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!judgeName || judgeName.trim().length === 0) {
    return NextResponse.json({ error: "Nom du juge requis" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Insérer le nouveau juge
  const { data, error } = await supabase
    .from('judges')
    .insert({
      name: judgeName.trim(),
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
      created_at: data.created_at
    }
  });
}