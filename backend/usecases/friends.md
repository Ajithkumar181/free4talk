Certainly! Here’s a professional and well-structured explanation of the **friends** module with table schema and detailed backend use cases:

---

# 3. friends

**Manages friendships, friend requests, and blocks**

---

## Table Structure

```sql
CREATE TABLE friends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,             -- User who initiates the action
    friend_id INT NOT NULL,           -- Target user of the action
    status ENUM('pending', 'accepted', 'blocked') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_friendship (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
);
```

---

## Backend Use Cases Explained

### 1. Send Friend Request

* When **User A** wants to add **User B** as a friend:

  * Backend creates a record in `friends` with:

    * `user_id = A`
    * `friend_id = B`
    * `status = 'pending'`
    * `created_at` timestamp
  * This represents a pending friend request waiting for User B’s response.
  * **Validation:** Prevent duplicate or existing friend requests or friendships.
Sure! Here are just the **headings** for the frontend use cases of **Send Friend Request**:

---

### Frontend Use Cases for Send Friend Request

1. User clicks "Add Friend" button on another user's profile
2. User tries to send request to themselves
3. User tries to send a request when already friends or pending
4. User views a list of users and can send friend requests
5. Handle network errors or server errors
6. Real-time UI update after sending request

---

Let me know if you want me to expand any of these!

---

### 2. Accept Friend Request

* When **User B** accepts the request from User A:

  * Backend updates the existing record’s `status` from `'pending'` to `'accepted'`.
  * Optionally, create a reciprocal record:

    * `user_id = B`
    * `friend_id = A`
    * `status = 'accepted'`
  * This depends on whether friendship is stored bidirectionally.
  * Both users are now recognized as friends.

---Sure! Here are just the headings for frontend use cases of **Accept Friend Request**:

---

### Frontend Use Cases for Accept Friend Request

1. User B views incoming friend requests list
2. User B clicks "Accept" button on a friend request
3. UI feedback after accepting
4. Handling reject or ignore
5. Real-time update for User A
6. Error handling

---


### 3. Block/Unblock Users

* **Blocking:**

  * Backend updates or creates a record with `status = 'blocked'` between blocker and blockee.
  * Blocked users:

    * Cannot send friend requests or messages to each other.
    * Cannot see each other’s online status or profiles depending on business rules.
* **Unblocking:**

  * Backend deletes or updates the record to remove the blocked status.
  * Restores ability to interact.
  
  Got it! Here are the **most essential** frontend use cases for **Blocking / Unblocking Users**:

---

### Essential Frontend Use Cases for Blocking / Unblocking Users

1. User clicks "Block" on another user’s profile or chat
2. Confirm block action before proceeding
3. Update UI and disable interaction with blocked user
4. User views and manages blocked users list
5. User clicks "Unblock" to restore interaction
6. Show success/error notifications for block/unblock

---



### 4. Fetch Mutual Friends and Friend Lists

* **Fetch Friend List:**

  * Query `friends` table for all records where `user_id = X` or `friend_id = X` and `status = 'accepted'`.
* **Fetch Mutual Friends:**

  * Find intersection of two users’ accepted friends.
  * Useful for showing “Mutual Friends” on user profiles.
  Sure! Here's a concise version of the frontend use cases:

---

### Frontend Use Cases for Fetching Friend Lists and Mutual Friends

1. **Show User’s Friend List** on profile/dashboard with username and profile picture.
2. **Display Mutual Friends** when viewing another user’s profile.
3. **Suggest Friends** based on mutual connections.
4. **Filter Social Feed** to show posts from friends only.
5. **Quick Actions** like messaging or blocking from friend list.
6. **Real-time Updates** to friend lists when friendships change.

---

Let me know if you want it even shorter or more detailed!


---

### 5. Control Chat Permissions Based on Friendships

* Before allowing chat between User A and User B:

  * Verify an accepted friendship exists between A and B.
  * Check neither user has blocked the other.
* Deny chat requests if friendship or permission conditions are not met.
* Ensures privacy and security in messaging.
 Sure! Here's a short version you can paste directly:

---

### ✅ Where to Use Chat Permission Check (Frontend)

1. **Profile Page**
   Show/Hide "Send Message" button based on permission.

2. **Chat Page**
   Before opening chat, call `/can-chat`. Block if not allowed.

3. **Friend List / Suggestions**
   Enable chat icon only if friendship is accepted and not blocked.

4. **Chat Popup**
   Show message instead of input box if chat isn’t allowed.

5. **Reply to Notifications**
   Block reply if permission check fails.

---

Use `/can-chat` API to enforce rules and enhance privacy.

---

## Additional Implementation Notes

* **Friend Request Expiry:**

  * Optionally implement automatic expiry or timeout for pending requests.
* **Notifications:**

  * Trigger real-time notifications on sending/accepting friend requests or blocking/unblocking actions.
* **Friend Suggestions:**

  * Use friend lists and mutual friends data to suggest new friends.

---

If you want, I can also help you with sample API endpoints or code snippets for these use cases!
