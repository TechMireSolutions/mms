import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  TEACHERS_WORK_DRILLDOWN_EVENT,
  applyTeachersWorkDrillDown,
  consumeTeachersWorkDrillDown,
  type TeachersWorkDrillDown,
} from "@/tenant/features/teachers/hooks/teachersWorkDrillDown";

const filter: TeachersWorkDrillDown = { quickFilter: "active" };

describe("applyTeachersWorkDrillDown", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("persists the filter to sessionStorage and dispatches a CustomEvent", () => {
    const listener = vi.fn();
    window.addEventListener(TEACHERS_WORK_DRILLDOWN_EVENT, listener);

    applyTeachersWorkDrillDown(filter);

    expect(sessionStorage.getItem("mms_teachers_work_drilldown")).toBe(JSON.stringify(filter));
    expect(listener).toHaveBeenCalledOnce();
    const event = listener.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail).toEqual(filter);
  });
});

describe("consumeTeachersWorkDrillDown", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("round-trips an applied filter and removes it from storage", () => {
    applyTeachersWorkDrillDown(filter);
    expect(consumeTeachersWorkDrillDown()).toEqual(filter);
    expect(sessionStorage.getItem("mms_teachers_work_drilldown")).toBeNull();
    expect(consumeTeachersWorkDrillDown()).toBeNull();
  });

  it("returns null when storage is empty", () => {
    expect(consumeTeachersWorkDrillDown()).toBeNull();
  });

  it("returns null and clears corrupt JSON", () => {
    sessionStorage.setItem("mms_teachers_work_drilldown", "{not-json");
    expect(consumeTeachersWorkDrillDown()).toBeNull();
    expect(sessionStorage.getItem("mms_teachers_work_drilldown")).toBeNull();
  });
});
