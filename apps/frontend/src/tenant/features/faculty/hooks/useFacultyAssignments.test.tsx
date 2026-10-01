import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  useFacultyAssignments,
  useSaveFacultyAssignment,
  useCloseFacultyAssignment,
  useDeleteFacultyAssignment,
  useAssignmentSubordinates,
  useAssignmentManagerChain,
} from './useFacultyAssignments';

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined; }
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockListAssignments = vi.fn();
const mockSaveAssignment = vi.fn();
const mockCloseAssignment = vi.fn();
const mockDeleteAssignment = vi.fn();
const mockGetAssignmentSubordinates = vi.fn();
const mockGetAssignmentManagerChain = vi.fn();

vi.mock('@/lib/api', () => ({
  apiContract: {
    faculty: {
      listAssignments: (...args: unknown[]) => mockListAssignments(...args),
      saveAssignment: (...args: unknown[]) => mockSaveAssignment(...args),
      closeAssignment: (...args: unknown[]) => mockCloseAssignment(...args),
      deleteAssignment: (...args: unknown[]) => mockDeleteAssignment(...args),
      getAssignmentSubordinates: (...args: unknown[]) => mockGetAssignmentSubordinates(...args),
      getAssignmentManagerChain: (...args: unknown[]) => mockGetAssignmentManagerChain(...args),
    },
  },
}));

function createTestWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return {
    queryClient,
    render(ui: React.ReactElement) { act(() => { root.render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>); }); },
    cleanup() { act(() => root.unmount()); container.remove(); },
  };
}

describe('useFacultyAssignments hooks', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('useFacultyAssignments fetches and parses assignments successfully', async () => {
    mockListAssignments.mockResolvedValueOnce({
      status: 200,
      body: { assignments: [{ id: 'asgn-1', facultyId: 'fac-1', departmentId: 'dept-1', designationId: 'des-1', isPrimary: true, startDate: '2024-01-01' }] },
    });
    let result: ReturnType<typeof useFacultyAssignments> | undefined;
    function Consumer() { result = useFacultyAssignments('fac-1'); return null; }
    const { render, cleanup } = createTestWrapper();
    render(<Consumer />);
    await act(async () => {
      await vi.waitFor(() => { expect(result?.isSuccess).toBe(true); });
    });
    expect(result?.data).toHaveLength(1);
    expect(result?.data?.[0].id).toBe('asgn-1');
    cleanup();
  });

  it('useSaveFacultyAssignment saves assignment and invalidates queries', async () => {
    mockSaveAssignment.mockResolvedValueOnce({
      status: 200,
      body: { assignment: { id: 'asgn-1', facultyId: 'fac-1', departmentId: 'dept-1', designationId: 'des-1', isPrimary: true, startDate: '2024-01-01' } },
    });
    let mutateAsync!: ReturnType<typeof useSaveFacultyAssignment>['mutateAsync'];
    function Consumer() { mutateAsync = useSaveFacultyAssignment('fac-1').mutateAsync; return null; }
    const { render, cleanup } = createTestWrapper();
    render(<Consumer />);
    let saved: unknown;
    await act(async () => {
      saved = await mutateAsync({ id: 'asgn-1', facultyId: 'fac-1', departmentId: 'dept-1', designationId: 'des-1', isPrimary: true, startDate: '2024-01-01' });
    });
    expect(saved).toBeDefined();
    expect(mockSaveAssignment).toHaveBeenCalled();
    cleanup();
  });

  it('useCloseFacultyAssignment closes assignment successfully', async () => {
    mockCloseAssignment.mockResolvedValueOnce({ status: 200, body: { success: true } });
    let mutateAsync!: ReturnType<typeof useCloseFacultyAssignment>['mutateAsync'];
    function Consumer() { mutateAsync = useCloseFacultyAssignment('fac-1').mutateAsync; return null; }
    const { render, cleanup } = createTestWrapper();
    render(<Consumer />);
    await act(async () => { await mutateAsync({ id: 'asgn-1', endDate: '2025-01-01' }); });
    expect(mockCloseAssignment).toHaveBeenCalledWith({ params: { facultyId: 'fac-1', id: 'asgn-1' }, body: { endDate: '2025-01-01' } });
    cleanup();
  });

  it('useDeleteFacultyAssignment deletes assignment successfully', async () => {
    mockDeleteAssignment.mockResolvedValueOnce({ status: 200, body: { success: true } });
    let mutateAsync!: ReturnType<typeof useDeleteFacultyAssignment>['mutateAsync'];
    function Consumer() { mutateAsync = useDeleteFacultyAssignment('fac-1').mutateAsync; return null; }
    const { render, cleanup } = createTestWrapper();
    render(<Consumer />);
    await act(async () => { await mutateAsync('asgn-1'); });
    expect(mockDeleteAssignment).toHaveBeenCalledWith({ params: { facultyId: 'fac-1', id: 'asgn-1' }, body: {} });
    cleanup();
  });

  it('useAssignmentSubordinates and useAssignmentManagerChain fetch hierarchies', async () => {
    mockGetAssignmentSubordinates.mockResolvedValueOnce({ status: 200, body: { tree: [{ id: 'asgn-sub-1', depth: 1 }] } });
    mockGetAssignmentManagerChain.mockResolvedValueOnce({ status: 200, body: { chain: [{ id: 'asgn-mgr-1', depth: 1 }] } });
    let subResult: ReturnType<typeof useAssignmentSubordinates> | undefined;
    let mgrResult: ReturnType<typeof useAssignmentManagerChain> | undefined;
    function Consumer() {
      subResult = useAssignmentSubordinates('asgn-1');
      mgrResult = useAssignmentManagerChain('asgn-1');
      return null;
    }
    const { render, cleanup } = createTestWrapper();
    render(<Consumer />);
    await act(async () => {
      await vi.waitFor(() => {
        expect(subResult?.isSuccess).toBe(true);
        expect(mgrResult?.isSuccess).toBe(true);
      });
    });
    expect(subResult?.data).toHaveLength(1);
    expect(mgrResult?.data).toHaveLength(1);
    cleanup();
  });
});
