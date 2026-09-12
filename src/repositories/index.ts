import { isSupabaseConfigured } from '@/lib/supabase';
import {
  mockAuthRepository,
  mockStudentApplicationRepository,
  mockStudentJobRepository,
  mockStudentRepository,
} from './mock';
import { supabaseAuthRepository } from './supabase/supabaseAuthRepository';
import { supabaseStudentApplicationRepository } from './supabase/supabaseStudentApplicationRepository';
import { supabaseStudentJobRepository } from './supabase/supabaseStudentJobRepository';
import { supabaseStudentRepository } from './supabase/supabaseStudentRepository';
import { supabaseEmployerRepository } from './supabase/supabaseEmployerRepository';
import { mockEmployerRepository } from './mock/mockEmployerRepository';
import { supabaseCompetitionRepository } from './supabase/supabaseCompetitionRepository';
import { mockCompetitionRepository } from './mock/mockCompetitionRepository';
import { supabaseMessageRepository } from './supabase/supabaseMessageRepository';
import { mockMessageRepository } from './mock/mockMessageRepository';
import { supabaseWorkRepository } from './supabase/supabaseWorkRepository';
import { mockWorkRepository } from './mock/mockWorkRepository';

export const authRepository = isSupabaseConfigured ? supabaseAuthRepository : mockAuthRepository;
export const employerRepository = isSupabaseConfigured ? supabaseEmployerRepository : mockEmployerRepository;
export const competitionRepository = isSupabaseConfigured ? supabaseCompetitionRepository : mockCompetitionRepository;
export const messageRepository = isSupabaseConfigured ? supabaseMessageRepository : mockMessageRepository;
export const workRepository = isSupabaseConfigured ? supabaseWorkRepository : mockWorkRepository;

// 학생용 저장소는 Supabase 구현이 준비되면 자동으로 교체된다. 연결값이 없는 UI 개발 환경은 mock으로 동작한다.
export const studentRepository = isSupabaseConfigured ? supabaseStudentRepository : mockStudentRepository;
export const studentJobRepository = isSupabaseConfigured ? supabaseStudentJobRepository : mockStudentJobRepository;
export const studentApplicationRepository = isSupabaseConfigured
  ? supabaseStudentApplicationRepository
  : mockStudentApplicationRepository;
