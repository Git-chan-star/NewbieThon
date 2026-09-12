import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL ?? process.env.EXPO_PUBLIC_ADMIN_EMAIL ?? 'admin@itgu.local';
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceRoleKey || !password) {
  console.error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD가 필요합니다.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('관리자 비밀번호는 8자 이상이어야 합니다.');
  process.exit(1);
}

if (password.length < 12) {
  console.warn('주의: 운영 배포 전에는 관리자 비밀번호를 12자 이상의 고유 값으로 교체하세요.');
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { role: 'student', display_name: '잇구 관리자' },
});

if (createError || !created.user) {
  console.error(createError?.message ?? '관리자 인증 계정을 만들지 못했습니다.');
  process.exit(1);
}

const { error: promoteError } = await supabase.rpc('promote_user_to_admin', {
  target_user_id: created.user.id,
});

if (promoteError) {
  await supabase.auth.admin.deleteUser(created.user.id);
  console.error(`관리자 권한 부여 실패: ${promoteError.message}`);
  process.exit(1);
}

console.log(`관리자 계정 생성 완료: ${email}`);
