-- Demo certificate for judges/testing: cert_id = DEMO-PRIYA-2024
-- Run this AFTER the certificates table exists and you have a valid user_id and user_project_id.
-- Replace the placeholder UUIDs with actual values from your database:
-- 1. Get a user_id from auth.users or users table
-- 2. Get a user_project_id from user_projects table
--
-- For Antigravity demo, insert with placeholder UUIDs - update manually if needed:
INSERT INTO certificates (
  id,
  user_id,
  user_project_id,
  cert_id,
  final_score,
  grade,
  score_breakdown,
  issued_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM users LIMIT 1),
  (SELECT id FROM user_projects LIMIT 1),
  'DEMO-PRIYA-2024',
  87.5,
  'A',
  '{
    "task_completion": 92,
    "communication_quality": 88,
    "documentation_quality": 85,
    "delegation": 82,
    "consistency": 91,
    "leadership": 90
  }'::jsonb,
  '2024-02-21T12:00:00Z'
)
ON CONFLICT (cert_id) DO UPDATE SET
  final_score = EXCLUDED.final_score,
  grade = EXCLUDED.grade,
  score_breakdown = EXCLUDED.score_breakdown,
  issued_at = EXCLUDED.issued_at;
