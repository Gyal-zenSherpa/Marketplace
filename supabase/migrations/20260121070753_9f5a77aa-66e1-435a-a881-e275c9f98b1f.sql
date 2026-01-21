-- Add columns for government ID document uploads to seller_applications
ALTER TABLE public.seller_applications 
ADD COLUMN IF NOT EXISTS document_type text,
ADD COLUMN IF NOT EXISTS document_image_url text;

-- Add constraint to ensure valid document types
ALTER TABLE public.seller_applications 
ADD CONSTRAINT valid_document_type CHECK (document_type IS NULL OR document_type IN ('citizenship', 'passport', 'driving_license'));

-- Create storage bucket for seller documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('seller-documents', 'seller-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for seller-documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'seller-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'seller-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all seller documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'seller-documents' AND public.has_role(auth.uid(), 'admin'));