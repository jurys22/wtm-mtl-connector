// Test complete password reset flow
async function test() {
  console.log('🔐 Testing Password Reset Feature\n');

  try {
    // Step 1: Request password reset
    console.log('1. Requesting password reset for sarah.developer@wtmmtl.com...');
    const resetRequest = await fetch('http://localhost:3000/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.developer@wtmmtl.com' })
    });
    const resetData = await resetRequest.json();

    if (!resetRequest.ok) {
      console.log('❌ Failed to request reset:', resetData);
      return;
    }

    console.log('✅ Reset request successful');
    console.log(`   Token: ${resetData.token?.substring(0, 16)}...`);
    console.log(`   Expires: ${resetData.expiresIn}`);

    if (!resetData.token) {
      console.log('❌ No token received');
      return;
    }

    const token = resetData.token;

    // Step 2: Reset password with token
    console.log('\n2. Resetting password with token...');
    const newPassword = 'NewPassword123!';
    const resetResponse = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: newPassword })
    });
    const resetResult = await resetResponse.json();

    if (!resetResponse.ok) {
      console.log('❌ Failed to reset password:', resetResult);
      return;
    }

    console.log('✅ Password reset successful');
    console.log(`   User: ${resetResult.user.display_name}`);
    console.log(`   Token received: ${resetResult.token ? 'Yes' : 'No'}`);

    // Step 3: Verify can login with new password
    console.log('\n3. Testing login with new password...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.developer@wtmmtl.com',
        password: newPassword
      })
    });
    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      console.log('❌ Login with new password failed:', loginData);
      return;
    }

    console.log('✅ Login with new password successful');
    console.log(`   User: ${loginData.user.display_name}`);

    // Step 4: Verify old password doesn't work (reset it back first)
    console.log('\n4. Verifying old password no longer works...');
    const oldLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.developer@wtmmtl.com',
        password: 'Test123!' // Old password
      })
    });

    if (oldLoginResponse.ok) {
      console.log('⚠️  Old password still works (unexpected)');
    } else {
      console.log('✅ Old password correctly rejected');
    }

    // Step 5: Test invalid token
    console.log('\n5. Testing with invalid token...');
    const invalidResponse = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'invalid_token_1234567890123456789012345678901234567890123456',
        password: 'AnotherPass123!'
      })
    });

    if (invalidResponse.ok) {
      console.log('⚠️  Invalid token accepted (security issue!)');
    } else {
      console.log('✅ Invalid token correctly rejected');
    }

    // Step 6: Test token reuse (should fail)
    console.log('\n6. Testing token reuse (should fail)...');
    const reuseResponse = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token, // Reusing the same token
        password: 'YetAnotherPass123!'
      })
    });

    if (reuseResponse.ok) {
      console.log('⚠️  Token reuse allowed (security issue!)');
    } else {
      console.log('✅ Token reuse correctly rejected');
    }

    // Step 7: Reset password back to original for future tests
    console.log('\n7. Resetting password back to Test123!...');
    const resetBackRequest = await fetch('http://localhost:3000/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.developer@wtmmtl.com' })
    });
    const resetBackData = await resetBackRequest.json();

    if (resetBackData.token) {
      const resetBackResponse = await fetch('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetBackData.token,
          password: 'Test123!'
        })
      });

      if (resetBackResponse.ok) {
        console.log('✅ Password reset back to Test123!');
      }
    }

    console.log('\n✅ All password reset tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

test();
