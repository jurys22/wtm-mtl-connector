import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

let db: Database | null = null;
let SQL: any = null;
let autoSaveInterval: NodeJS.Timeout | null = null;
let lastSaveTime: number = 0;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    if (!SQL) {
      SQL = await initSqlJs();
    }

    const dbPath = path.resolve(config.dbPath);

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
      console.log(`Database loaded: ${dbPath}`);
    } else {
      db = new SQL.Database();
      console.log(`New database created: ${dbPath}`);
    }

    // Enable foreign keys
    db!.run('PRAGMA foreign_keys = ON');

    // Setup auto-save every 10 seconds (silent to avoid log spam)
    if (!autoSaveInterval) {
      autoSaveInterval = setInterval(() => {
        if (db) {
          try {
            saveDatabase(true); // Silent auto-save
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        }
      }, 10000); // 10 seconds
      console.log('✓ Auto-save enabled (every 10 seconds)');
    }
  }

  if (!db) {
    throw new Error('Failed to initialize database');
  }

  return db;
}

export function saveDatabase(silent: boolean = false): void {
  if (db) {
    try {
      const dbPath = path.resolve(config.dbPath);
      const data = db.export();
      const dir = path.dirname(dbPath);

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(dbPath, data);
      lastSaveTime = Date.now();

      // Only log if not silent or if it's been more than 60 seconds
      if (!silent || (Date.now() - lastSaveTime > 60000)) {
        console.log(`✓ Database saved to: ${dbPath}`);
      }
    } catch (error) {
      console.error('❌ Failed to save database:', error);
      throw error;
    }
  } else {
    if (!silent) {
      console.warn('⚠️  No database instance to save');
    }
  }
}

export function closeDatabase(): void {
  if (db) {
    try {
      // Clear auto-save interval
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
      }

      saveDatabase();
      db.close();
      db = null;
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

// Graceful shutdown handlers
// SIGINT: Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, closing database...');
  closeDatabase();
  process.exit(0);
});

// SIGTERM: kill command
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, closing database...');
  closeDatabase();
  process.exit(0);
});

// beforeExit: Called when Node.js empties its event loop
process.on('beforeExit', (code) => {
  console.log('🛑 beforeExit triggered, saving database...');
  saveDatabase();
});

// exit: Last chance to do synchronous cleanup
process.on('exit', (code) => {
  console.log(`🛑 Process exit with code ${code}, ensuring database save...`);
  saveDatabase();
});

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught exception:', err);
  saveDatabase();
  process.exit(1);
});
