import bcrypt from 'bcrypt';
import { getDatabase, saveDatabase, closeDatabase } from '../db/index.js';
import { config } from '../config/index.js';

/**
 * Database Reset and Test User Seeding Utility
 *
 * This utility safely resets the database and seeds it with predefined test users
 * for development and testing purposes.
 *
 * SAFETY: Only works in non-production environments
 */

// Test user data
interface TestUser {
  email: string;
  password: string; // Plain text, will be hashed
  display_name: string;
  networking_intention: 'Searching for a job' | 'Searching for a hire' | 'Just chat';
  industry: string;
  tech_skills: string[];
  soft_skills: string[];
}

const TEST_USERS: TestUser[] = [
  {
    email: 'sarah.developer@wtmmtl.com',
    password: 'Test123!',
    display_name: 'Sarah Chen',
    networking_intention: 'Searching for a job',
    industry: 'Software / SaaS',
    tech_skills: ['Frontend (React, Vue, etc.)', 'Backend (Node, Python, Java, etc.)', 'DevOps / Cloud'],
    soft_skills: ['Problem Solving', 'Collaboration', 'Communication']
  },
  {
    email: 'michael.pm@wtmmtl.com',
    password: 'Test123!',
    display_name: 'Michael Rodriguez',
    networking_intention: 'Searching for a hire',
    industry: 'Finance',
    tech_skills: ['Product Analytics', 'Data Science / ML', 'Backend (Node, Python, Java, etc.)'],
    soft_skills: ['Leadership', 'Communication', 'Mentoring']
  },
  {
    email: 'emily.datascience@wtmmtl.com',
    password: 'Test123!',
    display_name: 'Emily Johnson',
    networking_intention: 'Just chat',
    industry: 'Healthcare',
    tech_skills: ['Data Science / ML', 'Data Engineering', 'Backend (Node, Python, Java, etc.)'],
    soft_skills: ['Problem Solving', 'Public Speaking', 'Initiative']
  }
];

/**
 * Check if we're in a safe environment to reset the database
 */
function checkEnvironmentSafety(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    throw new Error(
      '🚫 BLOCKED: Database reset is not allowed in production environment!\n' +
      '   Set NODE_ENV to "development" or "test" to enable this feature.'
    );
  }

  console.log(`✅ Environment check passed: ${nodeEnv}`);
}

/**
 * Truncate all tables in the correct order to avoid foreign key violations
 */
async function truncateAllTables(): Promise<void> {
  console.log('\n🗑️  Truncating all tables...');

  const db = await getDatabase();

  try {
    // Disable foreign keys temporarily for truncation
    db.run('PRAGMA foreign_keys = OFF');

    // Delete in correct order: dependent tables first
    const tables = [
      'user_sessions',       // Depends on users and sessions
      'meeting_requests',    // Depends on users
      'users',              // Parent table
      'sessions'            // Parent table
    ];

    for (const table of tables) {
      db.run(`DELETE FROM ${table}`);
      console.log(`   ✓ Cleared ${table}`);
    }

    // Re-enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Save changes
    await saveDatabase();

    console.log('✅ All tables truncated successfully\n');
  } catch (error) {
    db.run('PRAGMA foreign_keys = ON'); // Re-enable even on error
    throw error;
  }
}

/**
 * Seed conference sessions
 */
async function seedSessions(): Promise<void> {
  console.log('📅 Seeding conference sessions...');

  const db = await getDatabase();

  const sessions = [
    {
      title: 'Opening Keynote: Women in Tech 2026',
      start_time: '2026-04-18 09:00:00',
      end_time: '2026-04-18 10:00:00',
      location: 'Main Stage'
    },
    {
      title: 'Building Scalable Applications with Cloud Architecture',
      start_time: '2026-04-18 10:30:00',
      end_time: '2026-04-18 11:30:00',
      location: 'Room A'
    },
    {
      title: 'Career Development: From Developer to Tech Lead',
      start_time: '2026-04-18 10:30:00',
      end_time: '2026-04-18 11:30:00',
      location: 'Room B'
    },
    {
      title: 'Data Science & ML: Practical Applications',
      start_time: '2026-04-18 10:30:00',
      end_time: '2026-04-18 11:30:00',
      location: 'Room C'
    },
    {
      title: 'Lunch & Networking',
      start_time: '2026-04-18 12:00:00',
      end_time: '2026-04-18 13:00:00',
      location: 'Garden'
    },
    {
      title: 'DevOps Best Practices for Modern Teams',
      start_time: '2026-04-18 13:30:00',
      end_time: '2026-04-18 14:30:00',
      location: 'Room A'
    },
    {
      title: 'Frontend Frameworks: React, Vue, and Beyond',
      start_time: '2026-04-18 13:30:00',
      end_time: '2026-04-18 14:30:00',
      location: 'Room B'
    },
    {
      title: 'Cybersecurity Essentials for Developers',
      start_time: '2026-04-18 13:30:00',
      end_time: '2026-04-18 14:30:00',
      location: 'Room C'
    },
    {
      title: 'Panel: Diversity and Inclusion in Tech',
      start_time: '2026-04-18 15:00:00',
      end_time: '2026-04-18 16:00:00',
      location: 'Main Stage'
    },
    {
      title: 'Networking Coffee Break',
      start_time: '2026-04-18 16:00:00',
      end_time: '2026-04-18 16:30:00',
      location: 'Main Corridor'
    },
    {
      title: 'Closing Remarks & Raffle',
      start_time: '2026-04-18 16:30:00',
      end_time: '2026-04-18 17:00:00',
      location: 'Main Stage'
    }
  ];

  for (const session of sessions) {
    db.run(
      'INSERT INTO sessions (title, start_time, end_time, location) VALUES (?, ?, ?, ?)',
      [session.title, session.start_time, session.end_time, session.location]
    );
  }

  await saveDatabase();
  console.log(`✅ Seeded ${sessions.length} conference sessions\n`);
}

/**
 * Seed test users
 */
async function seedTestUsers(): Promise<void> {
  console.log('👥 Seeding test users...');

  const db = await getDatabase();
  const saltRounds = 12;

  for (const user of TEST_USERS) {
    // Hash password
    const passwordHash = await bcrypt.hash(user.password, saltRounds);

    // Insert user
    db.run(
      `INSERT INTO users (
        email,
        password_hash,
        display_name,
        networking_intention,
        industry,
        tech_skills,
        soft_skills
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.email,
        passwordHash,
        user.display_name,
        user.networking_intention,
        user.industry,
        JSON.stringify(user.tech_skills),
        JSON.stringify(user.soft_skills)
      ]
    );

    console.log(`   ✓ Created user: ${user.display_name} (${user.email})`);
  }

  await saveDatabase();
  console.log('✅ Seeded 3 test users\n');
}

/**
 * Verify the database state after reset
 */
async function verifyDatabase(): Promise<void> {
  console.log('🔍 Verifying database state...');

  const db = await getDatabase();

  // Check users count
  const usersResult = db.exec('SELECT COUNT(*) as count FROM users');
  const usersCount = usersResult[0]?.values[0]?.[0] || 0;

  // Check sessions count
  const sessionsResult = db.exec('SELECT COUNT(*) as count FROM sessions');
  const sessionsCount = sessionsResult[0]?.values[0]?.[0] || 0;

  // Check meeting requests count (should be 0)
  const requestsResult = db.exec('SELECT COUNT(*) as count FROM meeting_requests');
  const requestsCount = requestsResult[0]?.values[0]?.[0] || 0;

  // Check user_sessions count (should be 0)
  const userSessionsResult = db.exec('SELECT COUNT(*) as count FROM user_sessions');
  const userSessionsCount = userSessionsResult[0]?.values[0]?.[0] || 0;

  console.log(`   📊 Users: ${usersCount}`);
  console.log(`   📊 Sessions: ${sessionsCount}`);
  console.log(`   📊 Meeting Requests: ${requestsCount}`);
  console.log(`   📊 User Sessions: ${userSessionsCount}`);

  if (usersCount === 3 && sessionsCount === 11 && requestsCount === 0 && userSessionsCount === 0) {
    console.log('✅ Database verification passed!\n');
  } else {
    console.warn('⚠️  Database state differs from expected values\n');
  }
}

/**
 * Display test user credentials
 */
function displayTestUserCredentials(): void {
  console.log('🔑 Test User Credentials:');
  console.log('━'.repeat(70));

  TEST_USERS.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.display_name}`);
    console.log(`   Email:    ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log(`   Role:     ${user.networking_intention}`);
    console.log(`   Industry: ${user.industry}`);
  });

  console.log('\n' + '━'.repeat(70));
}

/**
 * Main reset function
 */
export async function resetDatabase(): Promise<void> {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🔄 DATABASE RESET AND SEED UTILITY');
    console.log('='.repeat(70) + '\n');

    // Step 1: Safety check
    checkEnvironmentSafety();

    // Step 2: Truncate all tables
    await truncateAllTables();

    // Step 3: Seed conference sessions
    await seedSessions();

    // Step 4: Seed test users
    await seedTestUsers();

    // Step 5: Verify
    await verifyDatabase();

    // Step 6: Display credentials
    displayTestUserCredentials();

    console.log('\n✅ Database reset completed successfully!');
    console.log('='.repeat(70) + '\n');

  } catch (error: any) {
    console.error('\n❌ Database reset failed:', error.message);
    throw error;
  }
}

/**
 * Export for use as a module
 */
export { TEST_USERS };
