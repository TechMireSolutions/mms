import { describe, expect, it, vi } from "vitest";
import { invalidateAttendanceQueries } from "./invalidateAttendanceQueries";

describe("invalidateAttendanceQueries utility", () => {
  it("invalidates all attendance query keys on queryClient", () => {
    const queryClient = {
      invalidateQueries: vi.fn(),
    } as any;

    invalidateAttendanceQueries(queryClient);

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(3);
  });
});
