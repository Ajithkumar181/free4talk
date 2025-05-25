Certainly! Here’s a professional, well-structured presentation that includes the **groups** table schema upfront along with the backend use cases and role management integrated:

---

## 👪 7. groups

### 📋 Table Schema

**groups**

| Column          | Type           | Description                                     |
| --------------- | -------------- | ----------------------------------------------- |
| group\_id       | INT (PK)       | Unique group identifier                         |
| group\_name     | VARCHAR        | Name of the group                               |
| group\_pic\_url | VARCHAR (NULL) | URL of group avatar/image                       |
| created\_by     | INT (FK)       | User ID of group creator/admin                  |
| created\_at     | TIMESTAMP      | Timestamp of group creation                     |
| updated\_at     | TIMESTAMP      | Timestamp of last group update                  |
| status          | ENUM           | e.g. 'active', 'archived', 'deleted' (optional) |

**group\_members**

| Column     | Type      | Description                                           |
| ---------- | --------- | ----------------------------------------------------- |
| group\_id  | INT (FK)  | References groups.group\_id                           |
| user\_id   | INT (FK)  | User who is member of the group                       |
| role       | ENUM      | Role in group: 'admin', 'co-admin', 'member', 'guest' |
| joined\_at | TIMESTAMP | When user joined the group                            |

---

### 📌 Backend Use Cases

1. **Create New Group**

   * Input: `group_name` (required), optional `group_pic_url`, `created_by` (user ID), list of initial members.
   * Action: Insert record in `groups`.
   * Insert creator and initial members in `group_members` with roles (`admin` for creator, `member` for others).
   * Return `group_id`.

2. **Update Group Details**

   * Admins or group creator can update `group_name`, `group_pic_url`.
   * Validate role from `group_members` or `created_by`.
   * Update `updated_at` timestamp.

3. **Assign Roles within Group**

   * Admin can assign or update roles for members: `co-admin`, `member`, `guest`.
   * API to PATCH role for a member.
   * Enforce role-based permissions for group management.

4. **List User's Groups**

   * Query groups where `user_id` exists in `group_members`.
   * Support UI listing for user’s group chats.

5. **Delete or Archive Group** (Optional)

   * Only `admin` or `creator` can mark group as archived or deleted.
   * Update `status` in `groups` table accordingly.
   * Optionally notify members and remove access.

6. **Fetch Group Info**

   * Return `group_name`, `group_pic_url`, `created_by`, count of members, roles.
   * Support UI for group details display.

---

Would you like me to help draft the detailed API endpoints or the SQL statements for these operations?
