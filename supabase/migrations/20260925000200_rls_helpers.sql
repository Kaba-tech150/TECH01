-- Helpers RLS privés. Toute fonction SECURITY DEFINER reste dans le schéma private.
begin;

create or replace function private.has_role(requested_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profile_roles
    where profile_id = (select auth.uid()) and role = requested_role
  ) or exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = requested_role
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select private.has_role('admin'::public.user_role); $$;

create or replace function private.can_view_mission(target_mission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
    or exists (
      select 1 from public.missions m
      where m.id = target_mission_id and m.client_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.mission_assignments ma
      join public.agent_profiles ap on ap.id = ma.agent_id
      where ma.mission_id = target_mission_id
        and ma.status in ('pending', 'accepted', 'completed')
        and ap.profile_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.mission_assignments ma
      join public.company_profiles cp on cp.id = ma.company_id
      where ma.mission_id = target_mission_id
        and ma.status in ('pending', 'accepted', 'completed')
        and cp.profile_id = (select auth.uid())
    );
$$;

create or replace function private.can_view_assignment(target_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin() or exists (
    select 1
    from public.mission_assignments ma
    join public.missions m on m.id = ma.mission_id
    left join public.agent_profiles ap on ap.id = ma.agent_id
    left join public.company_profiles cp on cp.id = ma.company_id
    where ma.id = target_assignment_id
      and ma.status in ('pending', 'accepted', 'completed')
      and (m.client_id = (select auth.uid()) or ap.profile_id = (select auth.uid()) or cp.profile_id = (select auth.uid()))
  );
$$;

create or replace function private.is_assignment_agent(target_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.mission_assignments ma
    join public.agent_profiles ap on ap.id = ma.agent_id
    where ma.id = target_assignment_id
      and ma.status in ('accepted', 'completed')
      and ap.profile_id = (select auth.uid())
  );
$$;

create or replace function private.can_review_mission(target_mission_id uuid, target_reviewee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.missions m
    where m.id = target_mission_id
      and m.status in ('completed', 'paid')
      and (
        (m.client_id = (select auth.uid()) and exists (
          select 1 from public.mission_assignments ma
          where ma.mission_id = m.id and ma.status = 'completed'
            and (
              exists (select 1 from public.agent_profiles ap where ap.id = ma.agent_id and ap.profile_id = target_reviewee_id)
              or exists (select 1 from public.company_profiles cp where cp.id = ma.company_id and cp.profile_id = target_reviewee_id)
            )
        ))
        or (m.client_id = target_reviewee_id and exists (
          select 1 from public.mission_assignments ma
          where ma.mission_id = m.id and ma.status = 'completed'
            and (
              exists (select 1 from public.agent_profiles ap where ap.id = ma.agent_id and ap.profile_id = (select auth.uid()))
              or exists (select 1 from public.company_profiles cp where cp.id = ma.company_id and cp.profile_id = (select auth.uid()))
            )
        ))
      )
  );
$$;

revoke all on schema private from public, anon;
revoke all on all functions in schema private from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_role(public.user_role) to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.can_view_mission(uuid) to authenticated;
grant execute on function private.can_view_assignment(uuid) to authenticated;
grant execute on function private.is_assignment_agent(uuid) to authenticated;
grant execute on function private.can_review_mission(uuid, uuid) to authenticated;

commit;

