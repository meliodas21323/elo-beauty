import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const judgeId = searchParams.get('judgeId');

  if (!judgeId) {
    return NextResponse.json({ error: "judgeId manquant" }, { status: 400 });
  }

  const supabase = createServerClient();

  // 1. Récupérer les infos du juge (date d'inscription)
  const { data: judge, error: judgeError } = await supabase
    .from('judges')
    .select('id, name, login, created_at')
    .eq('id', judgeId)
    .single();

  if (judgeError || !judge) {
    return NextResponse.json({ error: "Juge non trouvé" }, { status: 404 });
  }

  // 2. Récupérer le nombre total de votes
  const { data: scores, error: scoresError } = await supabase
    .from('elo_scores')
    .select('votes')
    .eq('judge_id', judgeId);

  if (scoresError) {
    console.error("Erreur scores:", scoresError);
    return NextResponse.json({ error: "Erreur de récupération" }, { status: 500 });
  }

  const totalVotes = scores?.reduce((sum, s) => sum + (s.votes || 0), 0) || 0;

  // 3. Calculer le nombre de jours depuis l'inscription
  const inscriptionDate = new Date(judge.created_at);
  const today = new Date();
  const daysSinceInscription = Math.max(
    1,
    Math.ceil((today.getTime() - inscriptionDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // 4. Calculer la moyenne de votes par jour
  const averageVotesPerDay = (totalVotes / daysSinceInscription).toFixed(1);

  return NextResponse.json({
    judge: {
      name: judge.name,
      login: judge.login,
      inscriptionDate: inscriptionDate.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    stats: {
      totalVotes,
      daysSinceInscription,
      averageVotesPerDay: parseFloat(averageVotesPerDay)
    }
  });
}
