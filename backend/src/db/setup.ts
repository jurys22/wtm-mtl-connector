import fs from 'fs';
import path from 'path';
import { getDatabase, closeDatabase } from './index';

async function setupDatabase() {
  console.log('Setting up database...');

  const db = await getDatabase();
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Execute schema
  db.exec(schema);

  console.log('Database schema created successfully!');

  // Verify tables were created
  const result = db.exec(`
    SELECT name FROM sqlite_master
    WHERE type='table'
    ORDER BY name
  `);

  console.log('\nCreated tables:');
  if (result.length > 0 && result[0].values) {
    result[0].values.forEach((row: any) => {
      console.log(`  - ${row[0]}`);
    });
  }

  closeDatabase();
}

setupDatabase().catch(console.error);
