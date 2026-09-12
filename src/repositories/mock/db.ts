import type {
  Application,
  JobOffer,
  StudentCourse,
  StudentProfile,
  StudentProject,
  StudentSkill,
  User,
} from '@/domain/contracts/types';
import { readJSON, writeJSON } from './storage';

export interface MockDbShape {
  currentUserId: string | null;
  users: Record<string, User>;
  studentProfiles: Record<string, StudentProfile>;
  studentSkills: Record<string, StudentSkill[]>;
  studentCourses: Record<string, StudentCourse[]>;
  studentProjects: Record<string, StudentProject[]>;
  savedJobIds: Record<string, string[]>;
  applications: Application[];
  offers: JobOffer[];
}

const DB_KEY = 'db';

function emptyDb(): MockDbShape {
  return {
    currentUserId: null,
    users: {},
    studentProfiles: {},
    studentSkills: {},
    studentCourses: {},
    studentProjects: {},
    savedJobIds: {},
    applications: [],
    offers: [],
  };
}

let cache: MockDbShape | null = null;
let loading: Promise<MockDbShape> | null = null;

async function load(): Promise<MockDbShape> {
  if (cache) return cache;
  if (!loading) {
    loading = (async () => {
      const stored = await readJSON<MockDbShape>(DB_KEY);
      cache = stored ?? emptyDb();
      return cache;
    })();
  }
  return loading;
}

async function persist(): Promise<void> {
  if (cache) {
    await writeJSON(DB_KEY, cache);
  }
}

export const mockDb = {
  async get(): Promise<MockDbShape> {
    return load();
  },
  async update(mutator: (db: MockDbShape) => void): Promise<MockDbShape> {
    const db = await load();
    mutator(db);
    await persist();
    return db;
  },
  async reset(): Promise<void> {
    cache = emptyDb();
    await persist();
  },
};
