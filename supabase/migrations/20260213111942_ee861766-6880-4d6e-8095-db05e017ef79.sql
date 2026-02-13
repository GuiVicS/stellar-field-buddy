-- Make evidences bucket private
UPDATE storage.buckets SET public = false WHERE id = 'evidences';

-- Drop any overly permissive public access policy on evidences
DROP POLICY IF EXISTS "Public can view evidences" ON storage.objects;

-- Ensure authenticated users can still read from evidences bucket
CREATE POLICY "Authenticated can view evidences"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'evidences');
