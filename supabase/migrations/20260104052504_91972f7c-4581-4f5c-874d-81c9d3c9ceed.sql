-- Fix 1: Make item-images bucket private and require authentication
UPDATE storage.buckets SET public = false WHERE id = 'item-images';

-- Drop existing overly permissive storage policies
DROP POLICY IF EXISTS "Anyone can view item images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create new policy requiring authentication for viewing images
CREATE POLICY "Authenticated users can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-images' AND auth.role() = 'authenticated');

-- Fix 2: Restrict profiles table - drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Users can always view their own full profile (including email)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Create a security definer function to get poster name only (not email)
CREATE OR REPLACE FUNCTION public.get_poster_name(poster_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(full_name, 'Anonymous')
  FROM profiles
  WHERE id = poster_id
$$;