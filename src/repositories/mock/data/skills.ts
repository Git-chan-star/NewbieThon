export interface SkillCatalogItem {
  id: string;
  name: string;
  category: '개발' | '데이터·AI' | '디자인·UI·UX' | '기획·리서치' | '콘텐츠·마케팅';
}

export const SKILL_CATALOG: SkillCatalogItem[] = [
  { id: 'skill_html_css', name: 'HTML/CSS', category: '개발' },
  { id: 'skill_javascript', name: 'JavaScript', category: '개발' },
  { id: 'skill_react', name: 'React', category: '개발' },
  { id: 'skill_react_native', name: 'React Native', category: '개발' },
  { id: 'skill_python', name: 'Python', category: '개발' },
  { id: 'skill_java', name: 'Java', category: '개발' },
  { id: 'skill_spring', name: 'Spring', category: '개발' },
  { id: 'skill_sql', name: 'SQL', category: '데이터·AI' },
  { id: 'skill_pandas', name: 'Pandas', category: '데이터·AI' },
  { id: 'skill_excel', name: 'Excel', category: '데이터·AI' },
  { id: 'skill_figma', name: 'Figma', category: '디자인·UI·UX' },
  { id: 'skill_illustrator', name: '일러스트레이터', category: '디자인·UI·UX' },
  { id: 'skill_photoshop', name: '포토샵', category: '디자인·UI·UX' },
  { id: 'skill_research', name: '설문·리서치', category: '기획·리서치' },
  { id: 'skill_ppt', name: 'PPT 기획', category: '기획·리서치' },
  { id: 'skill_sns', name: 'SNS 운영', category: '콘텐츠·마케팅' },
  { id: 'skill_video_edit', name: '영상 편집', category: '콘텐츠·마케팅' },
  { id: 'skill_copywriting', name: '카피라이팅', category: '콘텐츠·마케팅' },
];

export function findSkillName(skillId: string): string {
  return SKILL_CATALOG.find((s) => s.id === skillId)?.name ?? skillId;
}
