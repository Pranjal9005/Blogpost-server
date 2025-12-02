# How to View Your Data in MySQL Workbench

## Step 1: Connect to Your Database

1. **Open MySQL Workbench**
2. **Double-click on your "blogpost" connection** (or whichever connection you're using)
   - You should see it in the MySQL Connections panel
   - Connection details: `root@127.0.0.1:3306`

3. **Enter your password** when prompted
   - Password: `silicon#1` (or your MySQL root password)

4. **Click "OK"** to connect

## Step 2: Select the Database

Once connected, you need to select the `blogpost` database:

1. In the **Navigator** panel (left side), look for **SCHEMAS**
2. Find and click on **`blogpost`** database
3. If you don't see it, refresh the schemas:
   - Right-click on **SCHEMAS** → **Refresh All**

## Step 3: View Tables

After selecting the `blogpost` database:

1. **Expand** the `blogpost` database (click the arrow next to it)
2. You should see:
   - **Tables**
   - **Views**
   - **Stored Procedures**
   - etc.

3. **Expand "Tables"** to see:
   - `posts`
   - `users`

## Step 4: View Data in Tables

### Method 1: Using Table Icons (Easiest)

1. **Right-click** on a table (e.g., `users` or `posts`)
2. Select **"Select Rows - Limit 1000"**
3. This will open a query tab showing all data

### Method 2: Using SQL Query

1. Click on **File** → **New Query Tab** (or press `Ctrl+T` / `Cmd+T`)
2. Type the following SQL queries:

**To see all users:**
```sql
USE blogpost;
SELECT * FROM users;
```

**To see all posts:**
```sql
USE blogpost;
SELECT * FROM posts;
```

**To see posts with author names:**
```sql
USE blogpost;
SELECT 
    p.id,
    p.title,
    p.content,
    u.username as author,
    p.created_at,
    p.updated_at
FROM posts p
JOIN users u ON p.author_id = u.id
ORDER BY p.created_at DESC;
```

3. **Click the execute button** (lightning bolt icon) or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

## Step 5: Refresh Data

If you don't see data or it looks outdated:

1. **Right-click on the table** → **Refresh**
2. Or re-run your query
3. Or close and reopen the query tab

## Quick SQL Queries to Check Your Data

### Count Records
```sql
USE blogpost;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_posts FROM posts;
```

### View Recent Posts
```sql
USE blogpost;
SELECT 
    id,
    title,
    author_id,
    created_at
FROM posts
ORDER BY created_at DESC
LIMIT 10;
```

### View All Users
```sql
USE blogpost;
SELECT id, username, email, created_at FROM users;
```

## Troubleshooting

### If you don't see the `blogpost` database:

1. **Check your connection** - Make sure you're connected to the right MySQL server
2. **Verify database exists** - Run this query:
   ```sql
   SHOW DATABASES;
   ```
   You should see `blogpost` in the list

### If tables are empty:

1. **Verify data exists** - Run the check script:
   ```bash
   npm run check-data
   ```
2. **Check you're looking at the right database** - Make sure `USE blogpost;` is executed

### If connection fails:

1. **Check MySQL is running** - Make sure MySQL service is started
2. **Verify credentials** - Username: `root`, Password: `silicon#1`
3. **Check port** - Should be `3306`
4. **Check host** - Should be `127.0.0.1` or `localhost`

## Visual Guide

```
MySQL Workbench
├── Navigator Panel (Left)
│   └── SCHEMAS
│       └── blogpost  ← Click here
│           └── Tables
│               ├── users  ← Right-click → Select Rows
│               └── posts  ← Right-click → Select Rows
└── Query Tab (Right)
    └── Type SQL queries here
```

## Tips

1. **Save queries** - You can save frequently used queries for quick access
2. **Use filters** - In the table view, you can filter rows using the filter icon
3. **Export data** - Right-click table → "Table Data Export Wizard" to export data
4. **Auto-refresh** - Some views auto-refresh, but you may need to manually refresh

---

**Note:** Make sure your MySQL server is running and you're using the correct connection (the "blogpost" connection you showed earlier).


