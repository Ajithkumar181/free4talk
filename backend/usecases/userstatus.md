Here is a professionally structured and clearly formatted breakdown of the backend use cases for 🟢 User Status Management:

---

## 🟢 2. User Status – Backend Use Cases & Architecture

The user status module is responsible for tracking real-time presence, last seen timestamps, and custom status messages to enhance visibility and interaction in the system.

---

### 📌 Database Table: user\_status

| Column           | Type         | Description                           |
| ---------------- | ------------ | ------------------------------------- |
| user\_id         | INT (PK, FK) | References the user                   |
| is\_online       | BOOLEAN      | 1 if online, 0 if offline             |
| last\_active\_at | TIMESTAMP    | Last activity timestamp               |
| status\_message  | VARCHAR      | Optional user-defined status message  |
| updated\_at      | TIMESTAMP    | Timestamp of last update to any field |

---

### ✅ Use Case 1: Set Online/Offline Status

Used to reflect a user’s real-time connection state.

#### 🔹 API Triggered:

* On login → set online
* On logout or disconnect → set offline

#### ⚙️ Backend Logic:

```sql
UPDATE user_status
SET is_online = 1, last_active_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
WHERE user_id = ?;
```

On logout:

```sql
UPDATE user_status
SET is_online = 0, updated_at = CURRENT_TIMESTAMP
WHERE user_id = ?;
```

#### 📈 Result:

The system accurately reflects which users are online or offline in real time.

---

Here are short and memorable **use cases** to call **Set Online/Offline Status** functions:

---


#### 🔹 When to call:

1. **User logs in** → mark user as online.
2. **User logs out** → mark user as offline.
3. **Socket.IO connects** → set user online automatically.
4. **Socket.IO disconnects** → set user offline.
5. **App closed / tab closed** → trigger offline via socket disconnect.

---

Let me know if you need sample code or frontend triggers too.


### ✅ Use Case 2: Update Last Active Timestamp

Tracks user activity to support “last seen” and inactivity detection.

#### 🔹 Triggered:

* On any significant interaction (message sent, received, navigation, etc.)

#### ⚙️ Backend Logic:

```sql
UPDATE user_status
SET last_active_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
WHERE user_id = ?;
```

#### 📈 Result:

The UI can show “Last seen at X time” for offline users.
Sure! Here’s a super short version to remember:
usecases:
1. Show last seen time
2. Auto-logout inactive users
3. Sort chats by activity
4. Send inactivity reminders
5. Track user engagement stats


---

### ✅ Use Case 3: Set Custom Status Message

Enables users to personalize their availability (e.g., “Busy”, “On Vacation”).

#### 🔹 API Input:

* user\_id
* status\_message (string)

#### ⚙️ Backend Logic:

```sql
UPDATE user_status
SET status_message = ?, updated_at = CURRENT_TIMESTAMP
WHERE user_id = ?;
```
Sure! Here’s a very short, note-style list for **Set Custom Status Message** use cases:
Usecases:
* User manually updates status (e.g., Busy, In a meeting)
* Do Not Disturb mode activated
* Scheduled away/holiday status set
* Joins/leaves event or meeting
* Clears or resets status message


#### 📈 Result:

Other users can see status indicators like "Available", "In a meeting", etc.

---

### 🧠 Additional Considerations

| Feature                   | Description                                                  |
| ------------------------- | ------------------------------------------------------------ |
| WebSocket Integration     | Broadcast status changes in real-time to friends or contacts |
| TTL / Heartbeat Handling  | Use timeouts to auto-mark users offline after inactivity     |
| Status History (Optional) | Store past status logs for audit or analytics                |
| Rate Limiting             | Prevent frequent or abusive updates to custom status fields  |

---

Let me know if you need ER diagrams, API contracts, or integration into WebSocket infrastructure next.
