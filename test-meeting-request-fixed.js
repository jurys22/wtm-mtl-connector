// Test meeting request creation with correct user IDs
const testPassword = 'Test123!';

async function test() {
  try {
    // Step 1: Login as user 1
    console.log('1. Logging in as Sarah (user 1)...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.developer@wtmmtl.com',
        password: testPassword
      })
    });

    const loginData = await loginResponse.json();
    const userId = loginData.user.id;
    console.log(`✅ Logged in as ${loginData.user.display_name} (ID: ${userId})`);

    // Step 2: Get list of users to find a valid recipient
    console.log('\n2. Getting user list...');
    const usersResponse = await fetch('http://localhost:3000/api/users/users', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    const usersData = await usersResponse.json();
    console.log(`Found ${usersData.users.length} users:`);
    usersData.users.forEach(u => {
      console.log(`  - ID ${u.id}: ${u.display_name} (${u.email})`);
    });

    // Find a recipient (not the current user)
    const recipient = usersData.users.find(u => u.id !== userId);
    if (!recipient) {
      console.error('❌ No other users found');
      return;
    }

    console.log(`\nSelected recipient: ${recipient.display_name} (ID: ${recipient.id})`);

    // Step 3: Create meeting request
    console.log('\n3. Creating meeting request...');
    const meetingResponse = await fetch('http://localhost:3000/api/meeting-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        recipient_id: recipient.id,
        proposed_time: new Date('2026-04-18T14:00:00').toISOString(),
        proposed_place: 'Main corridor',
        note: 'Looking forward to connecting'
      })
    });

    const meetingData = await meetingResponse.json();
    console.log('Status:', meetingResponse.status);
    console.log('Response:', JSON.stringify(meetingData, null, 2));

    if (meetingResponse.ok) {
      console.log('\n✅ SUCCESS! Meeting request created');
      console.log('Meeting ID:', meetingData.meetingRequest.id);
      console.log('From:', loginData.user.display_name);
      console.log('To:', recipient.display_name);
      console.log('Time:', meetingData.meetingRequest.proposed_time);
      console.log('Location:', meetingData.meetingRequest.proposed_place);
    } else {
      console.log('\n❌ FAILED! Meeting request not created');
      console.log('Error:', meetingData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test();
