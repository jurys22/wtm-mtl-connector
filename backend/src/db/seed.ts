import { getDatabase, closeDatabase, saveDatabase } from './index';

async function seedDatabase() {
  console.log('Seeding database with conference sessions...');

  const db = await getDatabase();

  // Clear existing sessions
  db.run('DELETE FROM sessions');
  console.log('Cleared existing sessions');

  // Sample WTM MTL conference schedule
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

  // Insert sessions
  for (const session of sessions) {
    db.run(
      'INSERT INTO sessions (title, start_time, end_time, location) VALUES (?, ?, ?, ?)',
      [session.title, session.start_time, session.end_time, session.location]
    );
  }

  console.log(`Seeded ${sessions.length} conference sessions`);

  // Verify seeding
  const result = db.exec('SELECT COUNT(*) as count FROM sessions');
  if (result.length > 0 && result[0].values) {
    const count = result[0].values[0][0];
    console.log(`Total sessions in database: ${count}`);
  }

  saveDatabase();
  closeDatabase();
}

seedDatabase().catch(console.error);
