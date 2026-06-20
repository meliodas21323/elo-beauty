const bcrypt = require('bcryptjs');

// Les mots de passe en clair (à modifier selon les vrais mots de passe)
const judgesToUpdate = [
  { login: 'yaskurdzigg', password: 'Darko$-$AMA' },
  { login: 'boubou', password: 'La Terreur' },
  { login: 'meliodas', password: 'The Smoke Will Never Clear' },
  { login: 'meles', password: 'Maître Khettabier' }
];

async function generateHashes() {
  console.log('==========================================\n');
  console.log('-- Exécute ces commandes dans Supabase SQL Editor --\n');
  
  for (const judge of judgesToUpdate) {
    const hash = await bcrypt.hash(judge.password, 10);
    console.log(`UPDATE judges SET password = '${hash}' WHERE login = '${judge.login}';`);
  }
  
  console.log('\n-- Fin des commandes --');
  console.log('\n==========================================');
}

generateHashes();