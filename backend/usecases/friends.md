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

---

### 4. Fetch Mutual Friends and Friend Lists

* **Fetch Friend List:**

  * Query `friends` table for all records where `user_id = X` or `friend_id = X` and `status = 'accepted'`.
* **Fetch Mutual Friends:**

  * Find intersection of two users’ accepted friends.
  * Useful for showing “Mutual Friends” on user profiles.

---

### 5. Control Chat Permissions Based on Friendships

* Before allowing chat between User A and User B:

  * Verify an accepted friendship exists between A and B.
  * Check neither user has blocked the other.
* Deny chat requests if friendship or permission conditions are not met.
* Ensures privacy and security in messaging.

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
