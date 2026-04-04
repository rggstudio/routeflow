insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'diver_avatar',
    'diver_avatar',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  ),
  (
    'driver_avatar',
    'driver_avatar',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can upload their own avatars" on storage.objects;
create policy "Authenticated users can upload their own avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('diver_avatar', 'driver_avatar')
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Authenticated users can update their own avatars" on storage.objects;
create policy "Authenticated users can update their own avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('diver_avatar', 'driver_avatar')
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id in ('diver_avatar', 'driver_avatar')
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Authenticated users can delete their own avatars" on storage.objects;
create policy "Authenticated users can delete their own avatars"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('diver_avatar', 'driver_avatar')
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Authenticated users can read their own avatars" on storage.objects;
create policy "Authenticated users can read their own avatars"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('diver_avatar', 'driver_avatar')
  and auth.uid()::text = (storage.foldername(name))[1]
);
