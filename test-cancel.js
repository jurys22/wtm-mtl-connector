// Test meeting cancel flow
const testPassword = 'Test123!';

async function test() {
  try {
    // Step 1: Login as Sarah
    console.log('1. Logging in as Sarah...');
    const sarahLogin = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.developer@wtmmtl.com',
        password: testPassword
      })
    });
    const sarahData = await sarahLogin.json();
    console.log(`✅ Sarah logged in (ID: ${sarahData.user.id})`);

    // Step 2: Login as Michael
    console.log('\n2. Logging in as Michael...');
    const michaelLogin = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'michael.pm@wtmmtl.com',
        password: testPassword
      })
    });
    const michaelData = await michaelLogin.json();
    console.log(`✅ Michael logged in (ID: ${michaelData.user.id})`);

    // Step 2.5: Check for existing pending requests and cancel them
    console.log('\n2.5. Checking for existing pending requests...');
    const existingOutboxResponse = await fetch('http://localhost:3000/api/meeting-requests/outbox', {
      headers: {
        'Authorization': `Bearer ${sarahData.token}`
      }
    });
    const existingOutbox = await existingOutboxResponse.json();
    const existingPending = existingOutbox.meetingRequests.filter(m =>
      m.status === 'pending' && m.recipient_id === michaelData.user.id
    );

    for (const request of existingPending) {
      console.log(`   Cancelling existing request ${request.id}...`);
      await fetch(`http://localhost:3000/api/meeting-requests/${request.id}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${sarahData.token}` }
      });
    }

    // Step 3: Sarah creates a meeting request to Michael
    console.log('\n3. Sarah creates meeting request to Michael...');
    const createResponse = await fetch('http://localhost:3000/api/meeting-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sarahData.token}`
      },
      body: JSON.stringify({
        recipient_id: michaelData.user.id,
        proposed_time: new Date('2026-04-18T15:00:00').toISOString(),
        proposed_place: 'Garden',
        note: 'Testing cancel feature'
      })
    });
    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.log('❌ Failed to create meeting:', createData);
      return;
    }

    const meetingId = createData.meetingRequest.id;
    console.log(`✅ Meeting created (ID: ${meetingId})`);
    console.log(`   Status: ${createData.meetingRequest.status}`);

    // Step 4: Sarah cancels the meeting request
    console.log('\n4. Sarah cancels the meeting request...');
    const cancelResponse = await fetch(`http://localhost:3000/api/meeting-requests/${meetingId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${sarahData.token}`
      }
    });
    const cancelData = await cancelResponse.json();

    console.log('Status:', cancelResponse.status);
    console.log('Response:', JSON.stringify(cancelData, null, 2));

    if (cancelResponse.ok) {
      console.log('\n✅ SUCCESS! Meeting request cancelled');
    } else {
      console.log('\n❌ FAILED! Could not cancel');
      console.log('Error:', cancelData);
    }

    // Step 5: Verify the meeting was deleted by trying to fetch Sarah's outbox
    console.log('\n5. Verifying meeting was deleted from outbox...');
    const outboxResponse = await fetch('http://localhost:3000/api/meeting-requests/outbox', {
      headers: {
        'Authorization': `Bearer ${sarahData.token}`
      }
    });
    const outboxData = await outboxResponse.json();

    const foundMeeting = outboxData.meetingRequests.find(m => m.id === meetingId);
    if (!foundMeeting) {
      console.log('✅ Meeting request successfully removed from database');
    } else {
      console.log('❌ Meeting request still exists in database');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test();
