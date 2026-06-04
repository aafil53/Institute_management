# Creating Real Users in Supabase Authentication

## Overview
This guide explains how to create real user accounts in Supabase Authentication and sync them with the `users` table for role-based access control.

## Step 1: Create Users in Supabase Authentication

### Via Supabase Dashboard (Recommended for Setup)

1. **Go to Authentication** → **Users** in your Supabase dashboard
2. Click **"Add user"** (or **"Invite user"**)
3. Enter:
   - **Email**: (e.g., `sara@hudur.edu`, `admin@hudur.edu`)
   - **Password**: Choose a strong password
4. Click **"Send invite"** or **"Create user"**
5. Repeat for each user (teachers and admins)

### Via Supabase CLI

```bash
# Install if not already done
npm install -g supabase

# Login
supabase login

# Create a user (interactive)
supabase auth create-user
```

## Step 2: Create User Profiles in the `users` Table

Once users exist in Authentication, create their profiles in the `users` table.

### Option A: Via Supabase SQL Editor

```sql
-- Create admin users
INSERT INTO users (id, name, email, role, department)
VALUES 
  ('user-uuid-here', 'Dr. Sarah Admin', 'admin@hudur.edu', 'admin', 'Administration'),
  ('user-uuid-here', 'Mr. John Principal', 'principal@hudur.edu', 'admin', 'Administration');

-- Create teacher users
INSERT INTO users (id, name, email, role, department)
VALUES 
  ('user-uuid-here', 'Sara Khan', 'sara@hudur.edu', 'teacher', 'Science'),
  ('user-uuid-here', 'Ahmed Hassan', 'ahmed@hudur.edu', 'teacher', 'Mathematics'),
  ('user-uuid-here', 'Fatima Ali', 'fatima@hudur.edu', 'teacher', 'English');
```

**Important**: Replace `'user-uuid-here'` with the actual user ID from Supabase Authentication.

### How to Get User IDs:
1. Go to **Authentication** → **Users** in dashboard
2. Click on a user to view their ID
3. Copy the ID and use it in the INSERT statement

### Option B: Programmatically via React

```typescript
import { supabase } from './lib/supabase'

async function createUserProfile(userId: string, userData: {
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  department?: string
}) {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      id: userId,
      ...userData,
    }])
    .select()

  if (error) {
    console.error('Error creating user profile:', error)
    return null
  }

  return data
}

// Usage:
await createUserProfile('uuid-from-auth', {
  name: 'Sara Khan',
  email: 'sara@hudur.edu',
  role: 'teacher',
  department: 'Science',
})
```

## Step 3: Create Teacher Records

If a user has the `teacher` role, also create a record in the `teachers` table:

```sql
INSERT INTO teachers (user_id, name, employee_id, email, department, contact)
VALUES 
  ('user-uuid', 'Sara Khan', 'EMP001', 'sara@hudur.edu', 'Science', '+1234567890'),
  ('user-uuid', 'Ahmed Hassan', 'EMP002', 'ahmed@hudur.edu', 'Mathematics', '+1234567891'),
  ('user-uuid', 'Fatima Ali', 'EMP003', 'fatima@hudur.edu', 'English', '+1234567892');
```

## Complete Example Setup

Here's a complete setup for a small institution:

### Step 1: Create Auth Users
- `admin@hudur.edu` (password: secure-password-here)
- `sara@hudur.edu` (password: secure-password-here)
- `ahmed@hudur.edu` (password: secure-password-here)

### Step 2: Run This SQL (update UUIDs):

```sql
-- Create users table entries
INSERT INTO users (id, name, email, role, department) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Dr. Sarah Admin', 'admin@hudur.edu', 'admin', 'Administration'),
  ('00000000-0000-0000-0000-000000000002', 'Sara Khan', 'sara@hudur.edu', 'teacher', 'Science'),
  ('00000000-0000-0000-0000-000000000003', 'Ahmed Hassan', 'ahmed@hudur.edu', 'teacher', 'Mathematics');

-- Create teacher records
INSERT INTO teachers (user_id, name, employee_id, email, department, contact) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Sara Khan', 'T001', 'sara@hudur.edu', 'Science', '+1234567890'),
  ('00000000-0000-0000-0000-000000000003', 'Ahmed Hassan', 'T002', 'ahmed@hudur.edu', 'Mathematics', '+1234567891');
```

### Step 3: Test Login

In the app:
1. Go to login page (no more role selector)
2. Enter `admin@hudur.edu` and your password
3. Should automatically load as admin role
4. Try with `sara@hudur.edu` - should load as teacher

## Troubleshooting

### "Invalid email or password" Error
- Verify the email and password in Supabase Authentication
- Ensure the user exists in both Auth AND the `users` table
- Check the email matches exactly (case-sensitive in some cases)

### User Logs In But Role Shows as Null
- Create an entry in the `users` table for this auth user ID
- Ensure the `role` column is populated

### Can't Find User ID
- Go to Supabase Dashboard → Authentication → Users
- Click the user row to expand details
- Copy the ID shown at the top

## Best Practices

1. **Always create both**: Create user in Auth AND profile in `users` table
2. **Teacher Setup**: If role is `teacher`, also add to `teachers` table
3. **Passwords**: Use strong passwords (minimum 12 characters)
4. **Backup**: Keep a CSV of your users as backup
5. **Testing**: Create test accounts separate from production accounts

## Next Steps

- Seed demo data: classes, students, timetables
- Set up password reset functionality
- Implement user invitation system
- Add user management dashboard for admins
