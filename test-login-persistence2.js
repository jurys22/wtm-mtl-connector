// Test that users can login multiple times (database persistence)
async function test() {
  console.log('🔐 Testing Login Persistence\n');

  const testPasswords = ['NewPassword123!', 'Test123!']; // Try both passwords

  try {
    // Step 1: First login (try both passwords)
    console.log('1. First login attempt...');
    let login1, data1;
    let workingPassword = null;

    for (const password of testPasswords) {
      login1 = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'sarah.developer@wtmmtl.com',
          password: password
        })
      });
      data1 = await login1.json();

      if (login1.ok) {
        workingPassword = password;
        console.log(`✅ First login successful with password: ${password}`);
        console.log(`   User: ${data1.user.display_name}`);
        break;
      }
    }

    if (!workingPassword) {
      console.log('❌ Could not login with either password:', data1);
      return;
    }

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
        password: workingPassword
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

    // Step 4: Third login
    console.log('\n4. Third login attempt...');
    const login3 = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.developer@wtmmtl.com',
        password: workingPassword
      })
    });
    const data3 = await login3.json();

    if (!login3.ok) {
      console.log('❌ Third login failed:', data3);
      return;
    }

    console.log('✅ Third login successful');
    console.log(`   User: ${data3.user.display_name}`);

    // Step 5: Fourth login
    console.log('\n5. Fourth login attempt...');
    const login4 = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.developer@wtmmtl.com',
        password: workingPassword
      })
    });
    const data4 = await login4.json();

    if (!login4.ok) {
      console.log('❌ Fourth login failed:', data4);
      return;
    }

    console.log('✅ Fourth login successful');
    console.log(`   User: ${data4.user.display_name}`);

    console.log('\n✅ DATABASE PERSISTENCE TEST PASSED! ✅');
    console.log('   Users can now login multiple times without issues.');
    console.log('   The database is being saved correctly and persists across requests.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

test();
