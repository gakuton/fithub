import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { exercises } from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? 'file:./local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

const seedExercises = [
  { name: 'ベンチプレス',               category: '胸' },
  { name: 'インクラインダンベルプレス', category: '胸' },
  { name: 'ダンベルプレス',             category: '胸' },
  { name: 'ケーブルフライ',             category: '胸' },
  { name: 'ラットプルダウン',           category: '背中' },
  { name: 'デッドリフト',               category: '背中' },
  { name: 'スクワット',                 category: '脚' },
  { name: 'ブルガリアンスクワット',     category: '脚' },
  { name: 'カーフレイズ',               category: '脚' },
  { name: 'レッグレイズ',               category: '体幹' },
  { name: 'ドローイン',                 category: '体幹' },
  { name: 'アブドミナル',               category: '体幹' },
];

async function seed() {
  console.log('Seeding exercises...');
  for (const exercise of seedExercises) {
    await db.insert(exercises).values(exercise).onConflictDoNothing();
  }
  console.log(`Done. Inserted ${seedExercises.length} exercises.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
