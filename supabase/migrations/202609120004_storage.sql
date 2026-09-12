insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-images', 'profile-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('verification-documents', 'verification-documents', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf']),
  ('message-attachments', 'message-attachments', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']),
  ('engagement-deliverables', 'engagement-deliverables', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'application/zip'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy profile_images_public_read on storage.objects
for select using (bucket_id = 'profile-images');

create policy profile_images_owner_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy profile_images_owner_update on storage.objects
for update to authenticated
using (bucket_id = 'profile-images' and owner_id = auth.uid()::text)
with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy profile_images_owner_delete on storage.objects
for delete to authenticated
using (bucket_id = 'profile-images' and owner_id = auth.uid()::text);

create policy verification_owner_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'verification-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy verification_owner_read on storage.objects
for select to authenticated
using (
  bucket_id = 'verification-documents'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
create policy verification_owner_delete on storage.objects
for delete to authenticated
using (bucket_id = 'verification-documents' and owner_id = auth.uid()::text);

create policy message_attachment_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'message-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_conversation_participant(((storage.foldername(name))[2])::uuid)
);
create policy message_attachment_read on storage.objects
for select to authenticated
using (
  bucket_id = 'message-attachments'
  and public.is_conversation_participant(((storage.foldername(name))[2])::uuid)
);
create policy message_attachment_delete on storage.objects
for delete to authenticated
using (bucket_id = 'message-attachments' and owner_id = auth.uid()::text);

create policy deliverable_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'engagement-deliverables'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_engagement_party(((storage.foldername(name))[2])::uuid)
);
create policy deliverable_read on storage.objects
for select to authenticated
using (
  bucket_id = 'engagement-deliverables'
  and public.is_engagement_party(((storage.foldername(name))[2])::uuid)
);
create policy deliverable_delete on storage.objects
for delete to authenticated
using (bucket_id = 'engagement-deliverables' and owner_id = auth.uid()::text);
