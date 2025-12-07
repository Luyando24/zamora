# Database Migration Guide

Since I cannot execute commands directly against your production Supabase database (for security), you need to apply the schema changes manually.

## Option 1: Supabase Dashboard (Recommended)

1.  Open the file `supabase/FULL_DB_SETUP.sql` in this editor.
2.  Copy the entire content of the file.
3.  Go to your **Supabase Dashboard** (https://supabase.com/dashboard).
4.  Select your project.
5.  Click on the **SQL Editor** icon in the left sidebar.
6.  Click **New Query**.
7.  Paste the code you copied.
8.  Click **Run** (bottom right).

## Option 2: Supabase CLI (If configured)

If you have the Supabase CLI installed and linked to your project, you can run:

```bash
supabase db reset
```

*Note: This will wipe your local database and re-apply migrations. For production, use `supabase db push`.*

## Verification

After running the SQL, check the **Table Editor** in Supabase. You should see the following tables:
*   `hotels`
*   `profiles`
*   `room_types`
*   `rooms`
*   `menu_items`
*   `orders`
*   `bookings`
*   ...and others.

If you see these, your database is ready!
