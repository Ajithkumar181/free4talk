Certainly! Here's the updated structured use cases for 💬 **messages**, including the efficient message deletion policies you requested:

---

## 💬 5. messages

Stores chat messages for both 1-on-1 and group conversations, including text and media attachments.

### Table: `messages`

| Field          | Type       | Description                                                            |
| -------------- | ---------- | ---------------------------------------------------------------------- |
| id             | int (PK)   | Auto-incremented unique message identifier.                            |
| sender\_id     | int        | User ID of the message sender.                                         |
| message\_text  | text       | Text content of the message (nullable).                                |
| media\_id      | int        | Reference to media file if message contains media (nullable).          |
| created\_at    | timestamp  | Timestamp when the message was created.                                |
| is\_group\_msg | tinyint(1) | Flag indicating group (1) or direct message (0).                       |
| receiver\_id   | int        | User ID of direct message recipient (nullable for group messages).     |
| group\_id      | int        | Group ID if message is sent to a group (nullable for direct messages). |
| delivered      | tinyint(1) | Delivery status flag (0 = not delivered, 1 = delivered).               |
| is\_read       | tinyint(1) | Read status flag (0 = unread, 1 = read).                               |

---

### 📌 Backend Use Cases

1. **Save / Send Message**

   * Insert a new message with relevant fields and default flags for delivery and read status.

2. **Mark Message as Delivered**

   * Update `delivered` flag once message reaches recipient device(s).

3. **Mark Message as Read**

   * Update `is_read` flag upon recipient reading the message.

4. **Fetch Conversation History**

   * Retrieve messages by `receiver_id` (1-on-1) or `group_id` (group chat), ordered by `created_at`.

5. **Thread / Conversation Organization**

   * Organize messages by `receiver_id` or `group_id` for UI threads.

6. **Filter Unread or Undelivered Messages**

   * Query messages with `delivered = 0` or `is_read = 0` for status badges.

7. **Efficient Message Deletion Policies**

   * **1-on-1 Messages:** Automatically delete messages older than 7 days to optimize storage and privacy.

     * Backend runs scheduled jobs (cron or queue worker) to delete `messages` where `is_group_msg = 0` and `created_at < NOW() - INTERVAL 7 DAY`.
   * **Group Messages:** Upon group deletion, cascade delete all messages linked to that group (`group_id`).

     * Ensures no orphaned messages remain, freeing storage and maintaining data consistency.

---

### Efficiency Note

* These deletion policies help maintain database performance by purging stale or irrelevant messages regularly.
* Automated scheduled cleanups reduce manual intervention and keep storage optimized.
* Deleting group messages when the group is deleted prevents orphan data and potential privacy leaks.

---

If you'd like, I can help draft the SQL queries or the scheduler logic for these cleanup tasks!
