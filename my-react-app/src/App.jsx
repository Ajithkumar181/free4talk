import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';
const user_id = '1';

const styles = {
  app: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background:
      "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)",
    minHeight: '100vh',
    color: '#fff',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    fontWeight: '700',
    fontSize: '2.5rem',
    marginBottom: '0.25rem',
    textShadow: '1px 1px 4px rgba(0,0,0,0.6)',
  },
  subheader: {
    fontSize: '1.1rem',
    fontWeight: '500',
    marginBottom: '1.5rem',
    textShadow: '1px 1px 3px rgba(0,0,0,0.4)',
  },
  list: {
    background: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '15px',
    padding: '1.5rem',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    overflowY: 'auto',
    maxHeight: '70vh',
  },
  listItem: {
    background: 'rgba(255, 255, 255, 0.2)',
    marginBottom: '1rem',
    borderRadius: '12px',
    padding: '1rem',
    boxShadow: 'inset 0 0 8px rgba(255,255,255,0.25)',
  },
  userTitle: {
    fontWeight: '700',
    marginBottom: '0.5rem',
    fontSize: '1.1rem',
    color: '#fdf497',
  },
  detailList: {
    listStyleType: 'none',
    paddingLeft: '1rem',
    margin: 0,
  },
  detailItem: {
    fontSize: '0.95rem',
    marginBottom: '0.3rem',
    color: '#fff',
  },
  noUpdates: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#f8f8f8aa',
  },
};

function App() {
  const [statusUpdates, setStatusUpdates] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('✅ Connected to socket:', socket.id);
      socket.emit('user-online', user_id);
    });

    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat', user_id);
      console.log('❤️ Sent heartbeat');
    }, 10000);

    socket.on('user-status-update', (data) => {
      console.log('📩 Received user status update:', data);
      setStatusUpdates((prev) => {
        const filtered = prev.filter((u) => u.user_id !== data.user_id);
        return [data, ...filtered];
      });
    });

    const handleBeforeUnload = () => {
      socket.emit('user-offline', user_id);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      socket.emit('user-offline', user_id);
      socket.disconnect();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div style={styles.app}>
      <h1 style={styles.header}>🟢 Online Status Tracker</h1>
      <p style={styles.subheader}>Logged-in User ID: {user_id}</p>
      <h2 style={{ ...styles.subheader, marginTop: 0 }}>Live User Status Updates:</h2>
      <ul style={styles.list}>
        {statusUpdates.length === 0 ? (
          <li style={styles.noUpdates}>No updates received yet.</li>
        ) : (
          statusUpdates.map((update) => (
            <li key={update.user_id} style={styles.listItem}>
              <div style={styles.userTitle}>User {update.user_id} status:</div>
              <ul style={styles.detailList}>
                {Object.entries(update).map(([key, value]) => (
                  <li key={key} style={styles.detailItem}>
                    <strong>{key}:</strong> {String(value)}
                  </li>
                ))}
              </ul>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default App;
