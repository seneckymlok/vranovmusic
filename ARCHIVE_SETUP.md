# Archive System Setup Guide

## Overview
The archive management system is now fully implemented! Follow these steps to set it up.

## Step 1: Run Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire content of `supabase-archive-schema.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

This creates:
- `archive_folders` table
- `archive_photos` table
- All necessary indexes
- Row Level Security (RLS) policies
- Realtime subscriptions

## Step 2: Create Storage Bucket

### Option A: Using SQL (Recommended)
The migration file already includes storage bucket creation. If it ran successfully, you're done!

### Option B: Manual Setup (if SQL method didn't work)
1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. Click **New Bucket**
3. Set bucket name: `archive-photos`
4. Set as **Public bucket** (check the box)
5. Click **Create Bucket**

Then set up policies:
1. Click on the `archive-photos` bucket
2. Go to **Policies** tab
3. Add these policies:

**Policy 1: Public Read**
- Policy name: `Public read access`
- Allowed operation: `SELECT`
- Policy definition: `true`

**Policy 2: Authenticated Upload**
- Policy name: `Authenticated users can upload`
- Allowed operation: `INSERT`
- Policy definition: `(bucket_id = 'archive-photos' AND auth.role() = 'authenticated')`

**Policy 3: Authenticated Update**
- Policy name: `Authenticated users can update`
- Allowed operation: `UPDATE`
- Policy definition: `(bucket_id = 'archive-photos' AND auth.role() = 'authenticated')`

**Policy 4: Authenticated Delete**
- Policy name: `Authenticated users can delete`
- Allowed operation: `DELETE`
- Policy definition: `(bucket_id = 'archive-photos' AND auth.role() = 'authenticated')`

## Step 3: Verify Environment Variables

Make sure your `.env` file has:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ADMIN_PASSWORD=vranov2026
```

Get your Supabase credentials from:
Dashboard → Settings → API → Project URL & anon/public key

## Step 4: Test the System

### Access Admin Panel
1. Open the app: http://localhost:5173
2. Press **Ctrl+Shift+A** (or Cmd+Shift+A on Mac)
3. Or click the **Admin icon** in taskbar
4. Login with password: `vranov2026` (or your custom password from .env)

### Create Your First Folder
1. Click **ARCHIVE** tab in admin panel
2. Click **➕ New Folder**
3. Fill in:
   - Folder Name: e.g., "Summer Tour 2025"
   - Category: Photos/Videos/Flyers
   - Event Date: Optional
   - Description: Optional
4. Click **➕ Create**

### Upload Photos
1. Select the folder you just created (click on it)
2. Drag and drop photos into the upload zone
3. Or click the upload zone to browse files
4. Wait for upload progress to complete

### View Public Gallery
1. Close admin panel
2. Double-click **ARCHIVE** icon on desktop
3. Switch categories with tabs at top
4. Click on folder to view photos
5. Click on photo to open lightbox
6. Use arrow keys or navigation buttons to browse

## Features

### Admin Panel
✅ Tabbed interface (Shows | Archive)
✅ Create/edit/delete folders
✅ Drag-and-drop photo upload
✅ Multiple file upload support
✅ Automatic thumbnail generation
✅ Progress indicators
✅ Photo management (view, delete)
✅ Real-time sync across sessions

### Public Gallery
✅ Browse folders by category
✅ Thumbnail grid view
✅ Full-screen lightbox
✅ Keyboard navigation (← → Esc)
✅ Photo metadata display
✅ Responsive design (mobile & desktop)

## Troubleshooting

### "Supabase not configured" warning
- Check your `.env` file has correct credentials
- Restart dev server: Stop and run `npm run dev` again

### Photos not uploading
- Verify storage bucket exists and is public
- Check storage policies are set correctly
- Look at browser console for errors

### Can't see folders/photos
- Verify database migration ran successfully
- Check Supabase → Database → Tables for `archive_folders` and `archive_photos`
- Ensure RLS policies are enabled

### Admin panel blank
- Open browser console (F12)
- Check for JavaScript errors
- Verify ArchiveProvider is wrapping the app (already done)

## File Size Limits

Default Supabase limits:
- Free tier: 50MB per file
- Pro tier: Configurable

File size can be adjusted in `ArchiveContext.tsx` if needed.

## Next Steps

1. Customize the admin password in `.env`
2. Add your first event photos
3. Consider setting up authentication for admin-only access
4. Organize photos into folders by event/date

---

🎉 Your archive system is ready to use!
