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

