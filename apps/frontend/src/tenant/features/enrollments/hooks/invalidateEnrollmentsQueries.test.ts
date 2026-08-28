import { describe, expect, it, vi } from "vitest";
import { invalidateEnrollmentsQueries } from "./invalidateEnrollmentsQueries";

describe("invalidateEnrollmentsQueries", () => {
  it("calls invalidateQueries on queryClient for all enrollments keys", () => {
    const mockQueryClient = {
      invalidateQueries: vi.fn(),
    } as any;

    invalidateEnrollmentsQueries(mockQueryClient);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(6);
  });
});
