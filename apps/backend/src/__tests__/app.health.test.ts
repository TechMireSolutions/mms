import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/database.js", () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  pingDatabase: vi.fn().mockResolvedValue(true),
}));

import { pingDatabase } from "../db/database.js";
import { buildApp } from "../app.js";

describe("health routes", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.mocked(pingDatabase).mockResolvedValue(true);
  });

  it("GET /health returns OK", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: "OK" });
    await app.close();
  });

  it("GET /ready returns ready when database is connected", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/ready" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: "ready", database: "connected" });
    await app.close();
  });

  it("GET /ready returns 503 when database is down", async () => {
    vi.mocked(pingDatabase).mockResolvedValueOnce(false);
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/ready" });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ status: "not_ready", database: "disconnected" });
    await app.close();
  });
});
