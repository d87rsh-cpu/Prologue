-- Demo account setup for judges: Employee ID PRO-2024-00001, password prologue2024demo
--
-- STEP 1: Sign up via the app with: Name: Rahul Kumar, Email: demo@prologue.app, Password: prologue2024demo
-- STEP 2: Run this migration to set employee_id and create placeholder project for demo certificates.

UPDATE users
SET employee_id = 'PRO-2024-00001',
    name = 'Rahul Kumar'
WHERE id = (SELECT id FROM users ORDER BY created_at DESC LIMIT 1)
  AND (employee_id IS NULL OR employee_id != 'PRO-2024-00001');

INSERT INTO user_projects (
  user_id, project_title, one_liner, status, my_role_id, problem, target_date, submitted_at
)
SELECT
  u.id,
  'E-Commerce Backend API',
  'Demo project for Prologue judges',
  'completed',
  'backend_dev',
  'Demo',
  CURRENT_DATE + 30,
  NOW() - INTERVAL '1 month'
FROM users u
WHERE u.employee_id = 'PRO-2024-00001'
  AND NOT EXISTS (SELECT 1 FROM user_projects up WHERE up.user_id = u.id)
LIMIT 1;
