# Database Migration Guide

Since you are connected to a remote Supabase project and the `supabase` CLI is not available in your environment, you cannot run `supabase db reset`.

Instead, follow these steps to apply the latest fixes and schema changes.

## Step 1: Apply the Consolidated Fix

1.  Open the file `supabase/migrations/20251207_CONSOLIDATED_FIX.sql` in this editor.
2.  Copy the entire content of the file.
3.  Go to your **Supabase Dashboard** (https://supabase.com/dashboard).
4.  Select your project.
5.  Click on the **SQL Editor** icon in the left sidebar.
6.  Click **New Query**.
7.  Paste the code you copied.
8.  Click **Run** (bottom right).

## What this script does
*   Renames the `hotels` table to `properties`.
*   Renames all `hotel_id` columns to `property_id`.
*   Updates all database functions (including the one used by the Admin Dashboard).
*   Updates RLS policies to allow property creation and viewing.
*   Fixes the "column does not exist" errors.

## Verification
After running the script, your "Onboard New Property" flow and "Admin Users Dashboard" should work correctly.
