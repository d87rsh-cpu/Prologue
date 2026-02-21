import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ACTIVE_PROJECT_ID_KEY = 'prologue_active_project_id';

function mapRowToProject(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    projectTitle: row.project_title,
    oneLiner: row.one_liner,
    projectType: row.project_type,
    myRoleId: row.my_role_id,
    problem: row.problem,
    keyFeatures: row.key_features ?? [],
    outOfScope: row.out_of_scope,
    targetDate: row.target_date,
    hoursPerDay: row.hours_per_day,
    daysPerWeek: row.days_per_week ?? [],
    inviteEmail: row.invite_email,
    teamRolesNeeded: row.team_roles_needed ?? [],
    team_roles_needed: row.team_roles_needed ?? [],
    tasks: row.tasks ?? [],
    submittedAt: row.submitted_at,
    type: row.type,
  };
}

export function useActiveProject() {
  const location = useLocation();
  const projectIdFromState = location.state?.projectId;
  const [storedProjectId, setStoredProjectId] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || null;
    } catch {
      return null;
    }
  });
  const projectId = projectIdFromState ?? storedProjectId;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(!!projectId);

  useEffect(() => {
    if (projectIdFromState) {
      try {
        localStorage.setItem(ACTIVE_PROJECT_ID_KEY, projectIdFromState);
      } catch (_) {}
      setStoredProjectId(projectIdFromState);
    }
  }, [projectIdFromState]);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('user_projects')
      .select('*')
      .eq('id', projectId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error) {
          setProject(null);
          return;
        }
        setProject(mapRowToProject(data));
      });
    return () => { cancelled = true; };
  }, [projectId]);

  return { project, loading, projectId };
}
