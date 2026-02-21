-- Demo certificates for Rahul (PRO-2024-00001): DEMO-RAHUL-ECOM-2025, DEMO-RAHUL-SALES-2024
-- Run AFTER 20250222200000_demo_account.sql

INSERT INTO certificates (
  user_id,
  user_project_id,
  cert_id,
  final_score,
  grade,
  score_breakdown,
  issued_at
)
SELECT
  u.id,
  (SELECT id FROM user_projects WHERE user_id = u.id LIMIT 1),
  'DEMO-RAHUL-ECOM-2025',
  89,
  'A',
  '{"task_completion":92,"communication_quality":88,"documentation_quality":85,"delegation_effectiveness":78,"consistency":94,"leadership":87}'::jsonb,
  '2025-01-15T12:00:00Z'
FROM users u
WHERE u.employee_id = 'PRO-2024-00001'
ON CONFLICT (cert_id) DO NOTHING;

INSERT INTO certificates (
  user_id,
  user_project_id,
  cert_id,
  final_score,
  grade,
  score_breakdown,
  issued_at
)
SELECT
  u.id,
  (SELECT id FROM user_projects WHERE user_id = u.id LIMIT 1),
  'DEMO-RAHUL-SALES-2024',
  81,
  'B+',
  '{"task_completion":85,"communication_quality":72,"documentation_quality":88,"delegation_effectiveness":84,"consistency":79,"leadership":77}'::jsonb,
  '2024-12-03T12:00:00Z'
FROM users u
WHERE u.employee_id = 'PRO-2024-00001'
ON CONFLICT (cert_id) DO NOTHING;
