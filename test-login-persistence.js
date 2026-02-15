// Test that users can login multiple times (database persistence)
async function test() {
  console.log('🔐 Testing Login Persistence\n');

  try {
    // Step 1: First login
    console.log('1. First login attempt...');
    const login1 = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.developer@wtmmtl.com',
        password: 'Test123!' // Should be back to original password
      })
    });
    const data1 = await login1.json();

    if (!login1.ok) {
      console.log('❌ First login failed:', data1);
      return;
    }

    console.log('✅ First login successful');
    console.log(`   User: ${data1.user.display_name}`);
    console.log(`   Token: ${data1.token.substring(0, 20)}...`);

    // Step 2: Wait a moment (simulate logout)
    console.log('\n2. Waiting 2 seconds (simulating logout)...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Waited');

    // Step 3: Second login (this is where it would fail before)
    console.log('\n3. Second login attempt (testing persistence)...');
    const login2 = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.developer@wtmmtl.com',
        password: 'Test123!'
      })
    });
    const data2 = await login2.json();

    if (!login2.ok) {
      console.log('❌ Second login failed:', data2);
      console.log('   This means the database reset issue is NOT fixed!');
      return;
    }

    console.log('✅ Second login successful');
    console.log(`   User: ${data2.user.display_name}`);
    console.log(`   Token: ${data2.token.substring(0, 20)}...`);

    // Step 4: Third login
    console.log('\n4. Third login attempt...');
    const login3 = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.developer@wtmmtl.com',
        password: 'Test123!'
      })
    });
    const data3 = await login3.json();

    if (!login3.ok) {
      console.log('❌ Third login failed:', data3);
      return;
    }

    console.log('✅ Third login successful');
    console.log(`   User: ${data3.user.display_name}`);

    // Step 5: Test with Michael's account
    console.log('\n5. Testing with different account (michael.patane92@gmail.com)...');
    const login4 = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'michael.patane92@gmail.com',
        password: 'Test123!'
      })
    });
    const data4 = await login4.json();

    if (!login4.ok) {
      console.log('❌ Michael login failed:', data4);
      console.log('   Note: Try using password reset if you need access to this account');
      return;
    }

    console.log('✅ Michael login successful');
    console.log(`   User: ${data4.user.display_name}`);

    console.log('\n✅ Database persistence test PASSED!');
    console.log('   Users can now login multiple times without issues.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

test();
