import React, { useEffect, useState, useCallback } from 'react';

const GOOGLE_CLIENT_ID = '677069097968-qmcsi08dgufmsj1i9iopiljlcojceusc.apps.googleusercontent.com';

export default function GoogleLogin() {
  const [userData, setUserData] = useState(null); // Store server response
  const [error, setError] = useState(null);

  // Use useCallback to avoid redefining the handler on every render
  const handleCredentialResponse = useCallback(async (response) => {
    try {
      setError(null);
      const idToken = response.credential;

      const res = await fetch('http://localhost:5000/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const errorResponse = await res.json().catch(() => ({}));
        setError(errorResponse.error || 'Login failed');
        setUserData(null);
        return;
      }

      const data = await res.json();
      setUserData(data);
    } catch (err) {
      setError('An unexpected error occurred');
      setUserData(null);
      console.error(err);
    }
  }, []);

  useEffect(() => {
    // Add script only once
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInDiv'),
          { theme: 'outline', size: 'large' }
        );

        // Optional: Uncomment if you want the One Tap prompt automatically
        // window.google.accounts.id.prompt();
      }
    };

    return () => {
      // Cleanup script on unmount
      document.body.removeChild(script);
    };
  }, [handleCredentialResponse]);

  return (
    <div>
      <h2>Sign in with Google</h2>
      <div id="googleSignInDiv"></div>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {userData && (
        <div style={{ marginTop: '20px' }}>
          <h3>Login Successful!</h3>
          <p><strong>Username:</strong> {userData.username}</p>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>User ID:</strong> {userData.userId}</p>
          <p><strong>Token:</strong> <code>{userData.token}</code></p>
        </div>
      )}
    </div>
  );
}
