# MotoReach Project Guide

## 🚀 Setup & Troubleshooting

### 1. Database Migrations
**Critical Step**: Use this whenever you add new features (like Chat).
If you see errors like `ProgrammingError: relation "service_request_servicemessage" does not exist`, it means your database doesn't have the latest tables.

**Fix:**
```bash
# 1. Create migration files for any changes
python manage.py makemigrations

# 2. Apply migrations to the database
python manage.py migrate
```

### 2. WebSocket Connection Errors
If Chat or Notifications fail to connect (`WebSocket connection failed`):
1.  **Check the Backend Server**: Ensure `daphne` or `python manage.py runserver` is running.
2.  **Check Authentication**: Ensure your JWT token is valid (try logging out and in).
3.  **Check Database**: If `migrate` hasn't been run, the authentication consumer might crash looking for a user or session, or the view might crash locally before sending a response.

### 3. Workflow for Developers
-   **Always** run `makemigrations` and `migrate` after pulling new code designated for database schema updates.
-   **Service Execution**: The Chat is tied to `ServiceExecution`. It only works if a `ServiceRequest` has been accepted and connected to a `Workshop`.

---
*Created by MotoReach Team*
