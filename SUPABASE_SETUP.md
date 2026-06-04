# Supabase Setup Guide - Hudur Attendance System

## Overview
This guide walks you through setting up Supabase for the Hudur Attendance System backend.

## Prerequisites
- Supabase account (https://supabase.com)
- Access to Supabase dashboard
- Node.js and npm installed locally

## Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `hudur-attendance-system` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the region closest to your location
4. Click **"Create new project"** and wait for provisioning (2-3 minutes)

## Step 2: Get Your Connection Details

Once your project is created:

1. Go to **Settings** → **Database** (left sidebar)
2. Copy the following credentials:
   - **Project URL**: `https://[project-id].supabase.co`
   - **Public Anon Key**: Found in **Settings** → **API**
   - **Service Role Key**: Found in **Settings** → **API** (keep this secret!)

## Step 3: Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key-here
```

For backend/admin operations, also add:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important**: Never commit these keys to version control. Add `.env.local` to `.gitignore`.

## Step 4: Execute the Migrations

### Option A: Using Supabase SQL Editor (Recommended for first setup)

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire content from `supabase/migrations/001_create_initial_schema.sql`
4. Paste it into the SQL editor
5. Click **"Run"** and wait for completion
6. Repeat for `supabase/migrations/002_setup_rls_policies.sql`

### Option B: Using Supabase CLI (For future migrations)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to your account
supabase login

# Link to your project
supabase link --project-id your-project-id

# Run migrations
supabase db push
```

## Step 5: Verify the Setup

In Supabase Dashboard:

1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - `users`
   - `classes`
   - `teachers`
   - `students`
   - `timetable_entries`
   - `attendance_logs`
   - `attendance_records`

3. Click each table to verify columns are created correctly

## Step 6: Create Initial Admin User (Optional)

You can manually insert an admin user via SQL Editor:

```sql
INSERT INTO users (name, email, role, department)
VALUES ('Admin User', 'admin@hudur.local', 'admin', 'Administration');
```

Or set up authentication in your React app to create users programmatically.

## Schema Overview

### Tables and Relationships

```
users (Base authentication)
  ├── teachers (one teacher per user)
  │   └── timetable_entries
  │       └── attendance_logs
  │           └── attendance_records
  │
  └── students (independent)
      └── classes
          └── attendance_logs
              └── attendance_records

classes
  ├── students (many-to-many: students in a class)
  ├── timetable_entries (many-to-many: classes have multiple timetable slots)
  └── attendance_logs (one-to-many: attendance records per class)
```

### Key Constraints

- **Unique Constraints**:
  - `users.email` - Each user has a unique email
  - `teachers.employee_id` - Unique teacher ID
  - `students.roll_no` - Unique student roll number
  - `attendance_logs` - Only one attendance log per class per day per timetable
  - `attendance_records` - Only one record per student per attendance log

- **Foreign Keys**:
  - Teachers reference users
  - Students reference classes
  - Timetable entries reference classes and teachers
  - Attendance logs reference classes, timetable entries, and teachers
  - Attendance records reference logs and students

### Security (Row Level Security - RLS)

RLS is enabled on all tables with policies for:
- **Admins**: Full access to all tables
- **Teachers**: Can view/manage their own data and timetables
- **Students**: Can view public information (limited by policies)

## Next Steps

1. **Install Supabase Client**: 
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create a Supabase Client in your React app**:
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   )
   ```

3. **Update Authentication Context** to use Supabase Auth

4. **Implement API services** for each table using Supabase queries

## Troubleshooting

### Connection Issues
- Verify your URL and keys are correct in `.env.local`
- Check that your IP is whitelisted (usually automatic in Supabase)

### Permission Denied Errors
- Ensure RLS policies are correctly set up
- Check that your user has the correct role
- Verify authentication token is valid

### Table Already Exists
- If you run migrations twice, you'll get errors
- Drop all tables via SQL Editor and rerun: 
  ```sql
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  ```

## Support

For Supabase issues: https://supabase.com/docs
For project-specific issues: Check the AUTHENTICATION.md file in the project root
