import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';

class MockChildProcess extends EventEmitter {
  public killed = false;
  public kill(signal?: string): boolean {
    this.killed = true;
    this.emit('exit', null, signal || 'SIGTERM');
    return true;
  }
}

const mockFork = vi.fn();
let lastSpawnedChild: MockChildProcess | null = null;

vi.mock('node:child_process', () => ({
  fork: (scriptPath: string, args?: string[]) => {
    mockFork(scriptPath, args);
    const child = new MockChildProcess();
    lastSpawnedChild = child;
    return child;
  },
}));

vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

vi.mock('../db/database.js', () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
}));

// Setup database query mocks
const mockUpdateReturning = vi.fn().mockResolvedValue([{ id: 'job-123' }]);
const mockUpdateSet = vi.fn().mockReturnValue({
  where: vi.fn().mockReturnValue({
    returning: mockUpdateReturning,
  }),
});
const mockUpdate = vi.fn().mockReturnValue({
  set: mockUpdateSet,
});

const mockSelectLimit = vi.fn().mockResolvedValue([{ status: 'running' }]);
const mockSelectWhere = vi.fn().mockReturnValue({
  limit: mockSelectLimit,
});
const mockSelectFrom = vi.fn().mockReturnValue({
  where: mockSelectWhere,
});
const mockSelect = vi.fn().mockReturnValue({
  from: mockSelectFrom,
});

const mockTransaction = vi.fn();

const mockDb = {
  update: mockUpdate,
  select: mockSelect,
  transaction: mockTransaction,
};

vi.mock('../db/dbClient.js', () => ({
  getDb: () => mockDb,
}));

describe('worker background queue processor', () => {
  let initialSigtermListeners: ((signal: "SIGTERM") => void)[];
  let initialSigintListeners: ((signal: "SIGINT") => void)[];

  beforeEach(() => {
    initialSigtermListeners = process.listeners('SIGTERM') as ((signal: "SIGTERM") => void)[];
    initialSigintListeners = process.listeners('SIGINT') as ((signal: "SIGINT") => void)[];
    vi.clearAllMocks();
    vi.useFakeTimers();
    lastSpawnedChild = null;
  });

  afterEach(() => {
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    initialSigtermListeners.forEach((l) => process.on('SIGTERM', l));
    initialSigintListeners.forEach((l) => process.on('SIGINT', l));

    vi.useRealTimers();
    vi.resetModules();
  });

  it('initializes worker and claims next pending job', async () => {
    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({
              orderBy: () => ({
                limit: () => ({
                  for: () => Promise.resolve([
                    {
                      id: 'job-123',
                      tenantId: 'demo',
                      userId: 'u-1',
                      moduleId: 'contacts',
                      kind: 'export',
                      payload: '{}',
                      status: 'pending',
                    },
                  ]),
                }),
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };
      return callback(tx);
    });

    // Import and start worker explicitly
    const { startWorker } = await import('../worker.js');
    await startWorker();

    // Run fake timers to run the scheduled pollQueue loop
    await vi.runOnlyPendingTimersAsync();

    // Verify child_process.fork was called with job-123
    expect(mockFork).toHaveBeenCalled();
    const [scriptPath, args] = mockFork.mock.calls[0];
    expect(scriptPath).toContain('jobRunnerProcess');
    expect(args).toEqual(['job-123']);
  });

  it('marks job as failed if the child process exits with non-zero code', async () => {
    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({
              orderBy: () => ({
                limit: () => ({
                  for: () => Promise.resolve([
                    {
                      id: 'job-crash',
                      tenantId: 'demo',
                      userId: 'u-1',
                      moduleId: 'contacts',
                      kind: 'export',
                      payload: '{}',
                      status: 'pending',
                    },
                  ]),
                }),
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };
      return callback(tx);
    });

    // Mock select query during exit handler to check if job is still 'running'
    mockSelectLimit.mockResolvedValueOnce([{ status: 'running' }]);

    const { startWorker } = await import('../worker.js');
    await startWorker();
    await vi.runOnlyPendingTimersAsync();

    expect(lastSpawnedChild).not.toBeNull();

    // Simulate process crash by emitting exit with code 1
    lastSpawnedChild!.emit('exit', 1, null);
    await vi.runOnlyPendingTimersAsync();

    // Verify database update was called to set status to failed
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error: 'Worker process exited with code: 1',
      })
    );
  });

  it('terminates active child processes on worker shutdown signal', async () => {
    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({
              orderBy: () => ({
                limit: () => ({
                  for: () => Promise.resolve([
                    {
                      id: 'job-sigterm',
                      tenantId: 'demo',
                      userId: 'u-1',
                      moduleId: 'contacts',
                      kind: 'export',
                      payload: '{}',
                      status: 'pending',
                    },
                  ]),
                }),
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };
      return callback(tx);
    });

    const { startWorker } = await import('../worker.js');
    await startWorker();
    await vi.runOnlyPendingTimersAsync();

    expect(lastSpawnedChild).not.toBeNull();
    expect(lastSpawnedChild!.killed).toBe(false);

    // Get the registered SIGTERM listener and trigger it
    const listeners = process.listeners('SIGTERM');
    const shutdownListener = listeners[listeners.length - 1];
    expect(shutdownListener).toBeDefined();

    // Trigger shutdown listener
    await (shutdownListener as () => void | Promise<void>)();

    // Verify child process was killed
    expect(lastSpawnedChild!.killed).toBe(true);
  });
});
