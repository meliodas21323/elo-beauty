const bcrypt = require('bcryptjs');

const users = [
  { login: 'meliodas', password: 'The Smoke Will Never Clear' },
  { login: 'hiro', password: 'ShinyCharizard' },
  { login: 'boubou', password: 'La Terreur' },
  { login: 'meles', password: 'Maître Khettabier' },
  { login: 'yaskurdzigg', password: 'Darko$-$AMA' }
];

async function generateHashes() {
  console.log('-- Exécute ces commandes dans Supabase SQL Editor --\n');
  
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`UPDATE judges SET password = '${hash}' WHERE login = '${user.login}';`);
  }
  
  console.log('\n-- Terminé --');
}

generateHashes();