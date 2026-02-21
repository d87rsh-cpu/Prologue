-- Certificates table for storing issued certificates
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_project_id UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
  cert_id TEXT UNIQUE NOT NULL,
  final_score DECIMAL(5,2) NOT NULL,
  grade TEXT NOT NULL,
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Allow public read for verification (anyone can verify a certificate by cert_id)
CREATE POLICY "Certificates are publicly readable for verification"
  ON certificates FOR SELECT
  USING (true);

-- Only authenticated users can insert their own certificates
CREATE POLICY "Users can insert own certificates"
  ON certificates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for fast lookup by cert_id
CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON certificates(cert_id);
