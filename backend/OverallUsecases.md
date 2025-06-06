🔐 1. users
Handles user identity, registration, and profile information.

Backend Use Cases:

Register new user (username, email, password_hash)

User login authentication

Fetch/update profile info (profile_pic_url, status, dept, yr)

Track last_online for presence or analytics

🟢 2. user_status
Stores real-time presence and custom statuses.

Backend Use Cases:

Set is_online = 1 on login, 0 on logout

Update last_active_at on activity

Show "last seen" timestamps

Set custom status_message ("Busy", "Available", etc.)

👥 3. friends
Manages friendships, requests, and blocks.

Backend Use Cases:

Send friend request (status = 'pending')

Accept friend request (status = 'accepted')

Block/unblock user (status = 'blocked')

Fetch mutual friends / friend list

Control who can chat (via accepted friends)

📞 4. contacts
Manages user contact list for easier access.

Backend Use Cases:

Auto-sync friend list

Quickly lookup recent/active contacts

Show online/offline badge in UI

e

📎 6. media_files
Handles uploads (images, audio, files).

Backend Use Cases:

Upload media (voice note, image)

Generate media preview URLs

Associate messages with media_id

Retrieve file_type for rendering logic

👪 7. groups
Stores group chat info.

Backend Use Cases:

Create new group

Set group_name and group_pic_url

Identify created_by for admin privileges

Show all groups a user belongs to (via group_members)

👤 8. group_members
Tracks which users are in which groups.

Backend Use Cases:

Add/remove users from group

List members for a group

Manage roles/permissions (future scope)

Show “joined at” timestamp in group info

🔔 9. notifications
Push notification management.

Backend Use Cases:

Create notification on new message/friend request/call

Track read/unread state

Filter notifications by user_id

Feed alerts to UI/notifications bell