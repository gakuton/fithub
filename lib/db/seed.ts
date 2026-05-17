import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { exercises } from './schema';

const dbUrl = process.env.TURSO_DATABASE_URL;
if (!dbUrl || dbUrl.startsWith('file:')) {
  console.error('ERROR: TURSO_DATABASE_URL が未設定またはローカルファイルです。本番DBへの接続情報を確認してください。');
  console.error('  現在の値:', dbUrl ?? '(未設定)');
  process.exit(1);
}

console.log('接続先DB:', dbUrl);
const client = createClient({ url: dbUrl, authToken: process.env.TURSO_AUTH_TOKEN });
const db = drizzle(client);

const seedExercises = [
  { name: 'ベンチプレス',               category: '胸' },
  { name: 'インクラインダンベルプレス', category: '胸' },
  { name: 'ダンベルプレス',             category: '胸' },
  { name: 'ケーブルフライ',             category: '胸' },
  { name: 'ダンベルフライ',             category: '胸' },
  { name: 'ラットプルダウン',           category: '背中' },
  { name: 'デッドリフト',               category: '背中' },
  { name: 'シーテッドロー',             category: '背中' },
  { name: 'ダンベルロー',               category: '背中' },
  { name: 'スクワット',                 category: '脚' },
  { name: 'ブルガリアンスクワット',     category: '脚' },
  { name: 'カーフレイズ',               category: '脚' },
  { name: 'レッグレイズ',               category: '体幹' },
  { name: 'ドローイン',                 category: '体幹' },
  { name: 'アブドミナル',               category: '体幹' },
];

async function seed() {
  console.log(`Seeding ${seedExercises.length} exercises...`);
  let inserted = 0;
  let skipped = 0;
  for (const exercise of seedExercises) {
    const result = await db.insert(exercises).values(exercise).onConflictDoNothing().returning();
    if (result.length > 0) {
      console.log(`  + ${exercise.name}`);
      inserted++;
    } else {
      skipped++;
    }
  }
  console.log(`Done. inserted=${inserted}, skipped(already exists)=${skipped}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
