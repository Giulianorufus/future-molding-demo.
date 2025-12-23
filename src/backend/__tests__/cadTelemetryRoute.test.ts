import request from "supertest";

describe("GET /dev/cad-telemetry", () => {
  const originalLog = console.log;

  beforeAll(() => {
    console.log = () => {};
  });

  afterAll(() => {
    console.log = originalLog;
  });

  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test("enabled in non-production", async () => {
    process.env.NODE_ENV = "test";
    const { app } = await import("../server");

    const res = await request(app).get("/dev/cad-telemetry");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ts");
    expect(res.body).toHaveProperty("averageParseMs");
  });

  test("disabled in production unless ENABLE_DEV_ENDPOINTS=1", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.ENABLE_DEV_ENDPOINTS;

    const { app } = await import("../server");

    const res = await request(app).get("/dev/cad-telemetry");
    expect([404, 401]).toContain(res.status);
  });

  test("enabled in production when ENABLE_DEV_ENDPOINTS=1", async () => {
    process.env.NODE_ENV = "production";
    process.env.ENABLE_DEV_ENDPOINTS = "1";

    const { app } = await import("../server");

    const res = await request(app).get("/dev/cad-telemetry");
    expect(res.status).toBe(200);
  });
});
