-- PostgreSQL은 AND 조건의 평가 순서를 보장하지 않는다. 서로 다른 행 타입에서
-- 존재하지 않는 필드를 참조하지 않도록 테이블 종류를 먼저 분기한다.
create or replace function public.guard_server_managed_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(current_setting('itgu.workflow', true), 'off') = 'on' then
    return new;
  end if;

  if tg_table_name in ('jobs', 'applications', 'job_offers', 'engagements') then
    if old.status is distinct from new.status then
      raise exception 'status must be changed through a workflow RPC' using errcode = '42501';
    end if;
  elsif tg_table_name in ('employer_profiles', 'organizations') then
    if old.verification_status is distinct from new.verification_status then
      raise exception 'verification status is server managed' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;
