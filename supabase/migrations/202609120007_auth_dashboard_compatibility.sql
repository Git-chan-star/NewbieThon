-- Supabase 관리 콘솔은 사용자 생성 시 display_name 메타데이터를 입력받지 않는다.
-- 앱 가입은 전달된 이름을 우선 사용하고, 관리 콘솔 생성 계정만 이메일 앞부분을
-- 안전한 기본 표시명으로 사용한다. 역할은 기존과 같이 가입자가 admin을 선택할 수 없다.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role public.app_role;
  selected_name text;
begin
  selected_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(split_part(coalesce(new.email, ''), '@', 1)), ''),
    '새 사용자'
  );

  if nullif(new.raw_user_meta_data ->> 'role', '') is not null then
    selected_role := (new.raw_user_meta_data ->> 'role')::public.app_role;
    if selected_role = 'admin' then
      raise exception 'admin role cannot be selected during signup';
    end if;
  end if;

  insert into public.users (id, role, display_name)
  values (new.id, selected_role, selected_name);

  if selected_role = 'student' then
    insert into public.student_profiles (user_id) values (new.id);
  end if;
  return new;
exception
  when invalid_text_representation then
    raise exception 'role must be student or employer';
end;
$$;
