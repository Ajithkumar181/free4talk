Sure! Here are some common **backend use cases** for your `users` table schema with explanations on how each field can be utilized:

---

### 1. **User Registration**

* **Purpose:** Create a new user in the database.
* **Use fields:** `username`, `email`, `password_hash`, `profile_pic_url` (optional), `dept` (optional), `yr` (optional)
* **Example:** When a user signs up via email/password or social login, insert their info into `users`.

---

### 2. **User Authentication (Login)**

* **Purpose:** Verify user identity on login.
* **Use fields:** `email`, `password_hash`
* **Example:** Check if the provided email exists, compare the password hash for authentication.

---

### 3. **Social Login Integration**

* **Purpose:** Log in or sign up users via Google/Facebook OAuth.
* **Use fields:** `email`, `username`, `profile_pic_url`
* **Example:** On social login, check if the user exists by `email`. If not, create user with `username` and profile picture URL from OAuth provider.

---

### 4. **Fetch User Profile**

* **Purpose:** Retrieve a user’s profile info for display.
* **Use fields:** `id`, `username`, `email`, `profile_pic_url`, `status`, `dept`, `yr`, `last_online`
* **Example:** Show the user’s profile page or display user info in a chat app.

---

### 5. **Update User Profile**

* **Purpose:** Allow users to update their profile details.
* **Use fields:** `username`, `profile_pic_url`, `status`, `dept`, `yr`
* **Example:** Change display name, update profile picture URL, set current status, update department or year of study.

---

### 6. **Track User Activity**

* **Purpose:** Update and track the user’s last login or last active time.
* **Use fields:** `last_online`
* **Example:** Update `last_online` timestamp on every user interaction for "last seen" feature.
Frontend Calls:
The updateLastOnline call runs once immediately on app load

The 5-minute interval keeps running in the background, no matter how many pages the user navigates to

Because App.js stays mounted, navigating between pages (via React Router or other ways) does not reset or re-run that interva
---

### 7. **User Status Updates**

* **Purpose:** Store and display user availability or status message.
* **Use fields:** `status`
* **Example:** Show if a user is “online”, “away”, “busy”, or display a custom status message.
Frontend calls:
On the client side:
When app connects, send status "online"

When user sets status manually, send updated status

When app disconnects or user logs out, send "offline"

---

### 8. **Admin User Management**

* **Purpose:** Admins can view, update or delete users.
* **Use fields:** all fields relevant for display and management.
* **Example:** Admin dashboard lists users with filters on dept, year, or registration date (`created_at`).

---

### 9. **Password Reset / Change**

* **Purpose:** Update the `password_hash` when user changes password.
* **Use fields:** `password_hash`
* **Example:** User requests password reset; after verification, new hashed password replaces old one.

---

### 10. **User Search / Filtering**

* **Purpose:** Search users by department, year, username, or status.
* **Use fields:** `username`, `dept`, `yr`, `status`
* **Example:** Find users from a specific department or year for networking or communication.

---

### 11. **Account Creation Timestamp**

* **Purpose:** Keep track of when the user registered.
* **Use fields:** `created_at`
* **Example:** Show “Member since” info on profiles or filter users who joined recently.

---

### 12. **Profile Picture Storage**

* **Purpose:** Store URLs for user profile images.
* **Use fields:** `profile_pic_url`
* **Example:** Display user avatars in UI; URL may come from OAuth provider or user-uploaded image storage.

---

### 13. **Data Integrity and Uniqueness**

* **Constraints:** `username` and `email` are unique, so you can enforce no duplicates on signup.
* **Example:** Prevent two users from having the same username or email.

---

### Summary Table

| Use Case              | Key Fields Used                                       | Description                  |
| --------------------- | ----------------------------------------------------- | ---------------------------- |
| Registration          | `username`, `email`, `password_hash`                  | Add new user                 |
| Login                 | `email`, `password_hash`                              | Authenticate user            |
| Social Login          | `email`, `username`, `profile_pic_url`                | OAuth signup/login           |
| Fetch Profile         | `id`, `username`, `profile_pic_url`, `status`         | Display user data            |
| Update Profile        | `username`, `status`, `dept`, `yr`, `profile_pic_url` | Allow user profile updates   |
| Track Activity        | `last_online`                                         | Track last active timestamp  |
| User Status           | `status`                                              | Show online or custom status |
| Admin Management      | All relevant                                          | View/edit users              |
| Password Reset        | `password_hash`                                       | Update password hash         |
| Search/Filter Users   | `username`, `dept`, `yr`, `status`                    | Find users by filters        |
| Account Creation Date | `created_at`                                          | Show registration date       |
| Profile Picture       | `profile_pic_url`                                     | Store/display avatars        |
| Data Integrity        | `username`, `email`                                   | Enforce uniqueness           |

---

If you want, I can also help draft sample API endpoints or code for any of these use cases!
