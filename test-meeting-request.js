// Test meeting request creation
const testPassword = 'Test123!';

async function test() {
  try {
    // Step 1: Login
    console.log('1. Logging in as sarah.developer@wtmmtl.com...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.developer@wtmmtl.com',
        password: testPassword
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.token) {
      console.error('❌ Login failed - no token received');
      return;
    }

    console.log('✅ Login successful');

    // Step 2: Create meeting request
    console.log('\n2. Creating meeting request...');
    const meetingResponse = await fetch('http://localhost:3000/api/meeting-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        recipient_id: 2,
        proposed_time: new Date('2026-04-18T14:00:00').toISOString(),
        proposed_place: 'Main corridor',
        note: 'Looking forward to connecting'
      })
    });

    const meetingData = await meetingResponse.json();
    console.log('Meeting request response:', meetingData);
    console.log('Status:', meetingResponse.status);

    if (meetingResponse.ok) {
      console.log('✅ Meeting request created successfully');
    } else {
      console.log('❌ Meeting request failed:', meetingData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test();
