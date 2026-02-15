#!/usr/bin/env node

/**
 * Database Reset CLI Script
 *
 * Usage:
 *   npm run db:reset
 *   or
 *   node dist/scripts/reset-database.js
 *
 * This script resets the database and seeds it with test users.
 * Only works in development/test environments.
 */

import { resetDatabase } from '../utils/dbReset.js';
import { closeDatabase } from '../db/index.js';

async function main() {
  try {
    await resetDatabase();
    closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('Script failed:', error.message);
    closeDatabase();
    process.exit(1);
  }
}

main();
