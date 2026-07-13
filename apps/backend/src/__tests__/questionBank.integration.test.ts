import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import type { QuestionBankQuestion, QuestionBankTest, QuestionBankResult } from '@mms/shared';

vi.mock('../db/database.js', () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  pingDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('../services/auth/authArtifactService.js', () => ({
  purgeExpiredAuthArtifacts: vi.fn().mockResolvedValue(undefined),
  putAuthArtifact: vi.fn(),
  takeAuthArtifact: vi.fn(),
}));

vi.mock('../services/workspaceService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/workspaceService.js')>();
  const demoWorkspace = {
    id: 'ws-demo',
    subdomain: 'demo',
    madrasaName: 'Demo Madrasa',
    createdAt: '2026-01-01T00:00:00.000Z',
    enabled: true,
  };
  return {
    ...actual,
    getWorkspaceBySubdomain: vi.fn().mockImplementation(async (subdomain: string) =>
      subdomain === 'demo' ? demoWorkspace : null,
    ),
  };
});

const mockLoadQuestions = vi.fn();
const mockReplaceQuestions = vi.fn();
const mockLoadTests = vi.fn();
const mockReplaceTests = vi.fn();
const mockLoadResults = vi.fn();
const mockReplaceResults = vi.fn();
const mockGenerateQuestionBankTestSelection = vi.fn();

vi.mock('../services/questionBankService.js', () => ({
  loadQuestions: (...args: unknown[]) => mockLoadQuestions(...args),
  replaceQuestions: (...args: unknown[]) => mockReplaceQuestions(...args),
  loadTests: (...args: unknown[]) => mockLoadTests(...args),
  replaceTests: (...args: unknown[]) => mockReplaceTests(...args),
  loadResults: (...args: unknown[]) => mockLoadResults(...args),
  replaceResults: (...args: unknown[]) => mockReplaceResults(...args),
  generateQuestionBankTestSelection: (...args: unknown[]) => mockGenerateQuestionBankTestSelection(...args),
}));

const mockGetUserColumnPreferencesForModule = vi.fn();
const mockSetUserColumnPreferencesForModule = vi.fn();

vi.mock('../services/userColumnPreferencesService.js', () => ({
  getUserColumnPreferencesForModule: (...args: unknown[]) => mockGetUserColumnPreferencesForModule(...args),
  setUserColumnPreferencesForModule: (...args: unknown[]) => mockSetUserColumnPreferencesForModule(...args),
}));

const mockLoadQuestionBankCommandMetrics = vi.fn();
vi.mock('../services/questionBankMetricsService.js', () => ({
  loadQuestionBankCommandMetrics: (...args: unknown[]) => mockLoadQuestionBankCommandMetrics(...args),
}));

const sampleQuestion: QuestionBankQuestion = {
  id: 'q-1',
  categoryIds: ['cat-1'],
  categoryId: 'cat-1',
  type: 'mcq',
  difficulty: 'easy',
  questionLanguage: 'en',
  text: 'Simple Question',
  options: ['A', 'B', 'C', 'D'],
  answer: 'A',
};

const sampleTest: QuestionBankTest = {
  id: 't-1',
  name: 'Test 1',
  categoryId: 'cat-1',
  questionIds: ['q-1'],
  difficulty: 'easy',
  duration: 10,
  createdAt: '2026-06-26',
};

const sampleResult: QuestionBankResult = {
  id: 'r-1',
  testId: 't-1',
  studentId: 's-1',
  studentName: 'Ahmed',
  submittedAt: '2026-06-26',
  answers: { 'q-1': 'A' },
  scores: { 'q-1': 1 },
};

function teacherToken(app: Awaited<ReturnType<typeof buildApp>>): string {
  return app.jwt.sign({
    id: 'u-teacher',
    email: 'teacher@test.com',
    name: 'Teacher',
    role: 'teacher',
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

function unauthorizedToken(app: Awaited<ReturnType<typeof buildApp>>): string {
  return app.jwt.sign({
    id: 'u-unauthorized',
    email: 'unauth@test.com',
    name: 'Unauthorized',
    role: 'guardian',
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

describe('question bank REST routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadQuestions.mockReset().mockResolvedValue([sampleQuestion]);
    mockReplaceQuestions.mockReset().mockResolvedValue([sampleQuestion]);
    mockLoadTests.mockReset().mockResolvedValue([sampleTest]);
    mockReplaceTests.mockReset().mockResolvedValue([sampleTest]);
    mockLoadResults.mockReset().mockResolvedValue([sampleResult]);
    mockReplaceResults.mockReset().mockResolvedValue([sampleResult]);
    mockGenerateQuestionBankTestSelection.mockReset().mockResolvedValue({
      questionIds: ['q-1'],
      mode: 'ai',
    });
    mockGetUserColumnPreferencesForModule.mockReset().mockResolvedValue([]);
    mockSetUserColumnPreferencesForModule.mockReset().mockResolvedValue(undefined);
    mockLoadQuestionBankCommandMetrics.mockReset().mockResolvedValue({ totalQuestions: 1, totalTests: 1 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/question-bank/questions requires auth', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/question-bank/questions',
      headers: { host: 'demo.localhost' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('GET /api/question-bank/questions returns 403 for unauthorized roles', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/question-bank/questions',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${unauthorizedToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('GET /api/question-bank/questions loads questions for authorized users', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/question-bank/questions',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ questions: [sampleQuestion] });
    expect(mockLoadQuestions).toHaveBeenCalled();
    await app.close();
  });

  it('PUT /api/question-bank/questions/bulk updates questions', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/question-bank/questions/bulk',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([sampleQuestion]),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ questions: [sampleQuestion] });
    expect(mockReplaceQuestions).toHaveBeenCalledWith([sampleQuestion]);
    await app.close();
  });

  it('GET /api/question-bank/tests loads tests', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/question-bank/tests',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ tests: [sampleTest] });
    expect(mockLoadTests).toHaveBeenCalled();
    await app.close();
  });

  it('PUT /api/question-bank/tests/bulk updates tests', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/question-bank/tests/bulk',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([sampleTest]),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ tests: [sampleTest] });
    expect(mockReplaceTests).toHaveBeenCalledWith([sampleTest]);
    await app.close();
  });

  it('POST /api/question-bank/tests/generate requires auth', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/question-bank/tests/generate',
      headers: {
        host: 'demo.localhost',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        categoryIds: ['cat-1'],
        difficulty: 'easy',
        numQuestions: 1,
        shuffle: true,
      }),
    });
    expect(res.statusCode).toBe(401);
    expect(mockGenerateQuestionBankTestSelection).not.toHaveBeenCalled();
    await app.close();
  });

  it('POST /api/question-bank/tests/generate returns 403 for unauthorized roles', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/question-bank/tests/generate',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${unauthorizedToken(app)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        categoryIds: ['cat-1'],
        difficulty: 'easy',
        numQuestions: 1,
        shuffle: true,
      }),
    });
    expect(res.statusCode).toBe(403);
    expect(mockGenerateQuestionBankTestSelection).not.toHaveBeenCalled();
    await app.close();
  });

  it('POST /api/question-bank/tests/generate validates and returns generated selection', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/question-bank/tests/generate',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        categoryIds: ['cat-1'],
        difficulty: 'easy',
        numQuestions: 1,
        shuffle: true,
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ questionIds: ['q-1'], mode: 'ai' });
    expect(mockGenerateQuestionBankTestSelection).toHaveBeenCalledWith({
      categoryIds: ['cat-1'],
      difficulty: 'easy',
      numQuestions: 1,
      shuffle: true,
    });
    await app.close();
  });

  it('POST /api/question-bank/tests/generate rejects invalid requests', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/question-bank/tests/generate',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        categoryIds: ['cat-1'],
        difficulty: 'easy',
        numQuestions: 0,
        shuffle: true,
      }),
    });
    expect(res.statusCode).toBe(400);
    expect(mockGenerateQuestionBankTestSelection).not.toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/question-bank/assessment-results loads results', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/question-bank/assessment-results',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ results: [sampleResult] });
    expect(mockLoadResults).toHaveBeenCalled();
    await app.close();
  });

  it('PUT /api/question-bank/assessment-results/bulk updates results', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/question-bank/assessment-results/bulk',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([sampleResult]),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ results: [sampleResult] });
    expect(mockReplaceResults).toHaveBeenCalledWith([sampleResult]);
    await app.close();
  });

  it('GET /api/question-bank/metrics loads metrics', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/question-bank/metrics',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ metrics: { totalQuestions: 1, totalTests: 1 } });
    expect(mockLoadQuestionBankCommandMetrics).toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/question-bank/column-prefs loads column preferences', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/question-bank/column-prefs',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ preferences: [] });
    expect(mockGetUserColumnPreferencesForModule).toHaveBeenCalled();
    await app.close();
  });
});
