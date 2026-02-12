import 'dotenv/config';
import { readFileSync } from 'fs';
import { dataSource } from '../config/data-source';

async function runSql() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('=== fail to prefill orders');
    process.exit(1);
  }

  const sql = readFileSync(filePath, 'utf-8');

  await dataSource.initialize();

  try {
    const result = await dataSource.query(sql);
    console.log(result);
  } finally {
    await dataSource.destroy();
  }
}

runSql().catch((error) => {
  console.error(error);
  process.exit(1);
});
