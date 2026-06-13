require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImages() {
  const mappingFile = path.join(process.cwd(), 'data', 'cloudinary_mapping.json');
  const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));

  console.log(`📸 Upload de ${Object.keys(mapping).length} images vers Supabase...`);

  const images = Object.entries(mapping).map(([filename, url]) => ({
    id: filename,
    cloudinary_url: url
  }));

  // On insère par lots de 100 pour éviter les limites
  const batchSize = 100;
  let uploaded = 0;

  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('images')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    uploaded += batch.length;
    console.log(`✅ ${uploaded}/${images.length} images uploadées`);
  }

  console.log(`\n🎉 Terminé ! ${uploaded} images dans la base de données.`);
}

uploadImages();
