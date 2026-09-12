insert into public.skills (name, category)
values
  ('Kotlin', '모바일 개발'),
  ('Android Studio', '모바일 개발'),
  ('Jetpack Compose', '모바일 개발'),
  ('Java', '개발'),
  ('Python', '개발'),
  ('JavaScript', '웹 개발'),
  ('TypeScript', '웹 개발'),
  ('React', '웹 개발'),
  ('React Native', '모바일 개발'),
  ('SQL', '데이터'),
  ('Figma', '디자인'),
  ('Git', '협업')
on conflict (normalized_name) do nothing;

insert into public.competitions (
  title, organizer_name, summary, description, categories, required_skills,
  location, application_deadline, status, published_at
) values (
  '2026 대학생 AI 서비스 해커톤',
  '뉴비톤 운영팀',
  '생활 속 문제를 AI로 해결하는 대학생 해커톤',
  '기획, 디자인, 개발 전공자가 팀을 만들어 서비스를 완성합니다.',
  array['AI', '앱 서비스'],
  array['Python', 'React Native', 'Figma'],
  '서울',
  now() + interval '20 days',
  'published',
  now()
);
