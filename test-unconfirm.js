// Test meeting unconfirm flow
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
        note: 'Testing unconfirm feature'
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

    // Step 4: Michael accepts the meeting
    console.log('\n4. Michael accepts the meeting...');
    const acceptResponse = await fetch(`http://localhost:3000/api/meeting-requests/${meetingId}/accept`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${michaelData.token}`
      }
    });
    const acceptData = await acceptResponse.json();

    if (!acceptResponse.ok) {
      console.log('❌ Failed to accept meeting:', acceptData);
      return;
    }

    console.log(`✅ Meeting accepted`);
    console.log(`   Status: ${acceptData.meetingRequest.status}`);

    // Step 5: Try to unconfirm the meeting (as Sarah, the requester)
    console.log('\n5. Sarah tries to unconfirm the meeting...');
    const unconfirmResponse = await fetch(`http://localhost:3000/api/meeting-requests/${meetingId}/unconfirm`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${sarahData.token}`
      }
    });
    const unconfirmData = await unconfirmResponse.json();

    console.log('Status:', unconfirmResponse.status);
    console.log('Response:', JSON.stringify(unconfirmData, null, 2));

    if (unconfirmResponse.ok) {
      console.log('\n✅ SUCCESS! Meeting unconfirmed');
      console.log(`   New status: ${unconfirmData.meetingRequest.status}`);
    } else {
      console.log('\n❌ FAILED! Could not unconfirm');
      console.log('Error:', unconfirmData);
    }

    // Step 6: Also try as Michael (the recipient)
    console.log('\n6. Michael also tries to unconfirm (if step 5 failed)...');
    const unconfirmResponse2 = await fetch(`http://localhost:3000/api/meeting-requests/${meetingId}/unconfirm`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${michaelData.token}`
      }
    });
    const unconfirmData2 = await unconfirmResponse2.json();

    console.log('Status:', unconfirmResponse2.status);
    console.log('Response:', JSON.stringify(unconfirmData2, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test();
