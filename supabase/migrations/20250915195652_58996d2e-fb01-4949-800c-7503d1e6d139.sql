-- Create storage bucket for media
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist and recreate
drop policy if exists "Public read for media bucket" on storage.objects;
drop policy if exists "Users can upload their own media" on storage.objects;
drop policy if exists "Users can update their own media" on storage.objects;
drop policy if exists "Users can delete their own media" on storage.objects;

-- Public read policy for media bucket
create policy "Public read for media bucket"
on storage.objects
for select
using (bucket_id = 'media');

-- Allow users to upload to their own folder: <user_id>/...
create policy "Users can upload their own media"
on storage.objects
for insert
with check (
  bucket_id = 'media'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own media
create policy "Users can update their own media"
on storage.objects
for update
using (
  bucket_id = 'media'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'media'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own media
create policy "Users can delete their own media"
on storage.objects
for delete
using (
  bucket_id = 'media'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Add trigger for auto-creating user profile/settings if it doesn't exist
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();