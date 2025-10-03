-- Create storage bucket for media (idempotent)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Public read policy for media bucket
create policy if not exists "Public read for media bucket"
on storage.objects
for select
using (bucket_id = 'media');

-- Allow users to upload to their own folder: <user_id>/...
create policy if not exists "Users can upload their own media"
on storage.objects
for insert
with check (
  bucket_id = 'media'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own media
create policy if not exists "Users can update their own media"
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
create policy if not exists "Users can delete their own media"
on storage.objects
for delete
using (
  bucket_id = 'media'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger to auto-create profile and settings on new auth user (if missing)
-- Function public.handle_new_user already exists per context; add trigger if absent
create trigger if not exists on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();