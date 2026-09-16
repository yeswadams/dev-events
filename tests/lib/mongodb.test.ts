import mongoose from "mongoose";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadConnectDB(uri: string | undefined) {
  delete globalThis.mongoose;
  vi.resetModules();

  if (uri === undefined) {
    vi.stubEnv("MONGODB_URI", "");
  } else {
    vi.stubEnv("MONGODB_URI", uri);
  }

  return (await import("../../lib/mongodb")).default;
}

describe("connectDB", () => {
  afterEach(() => {
    delete globalThis.mongoose;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("fails before connecting when MONGODB_URI is missing", async () => {
    const connectDB = await loadConnectDB(undefined);
    const connect = vi.spyOn(mongoose, "connect");

    await expect(connectDB()).rejects.toThrow(
      "Please define the MONGODB_URI environment variable inside .env.local",
    );
    expect(connect).not.toHaveBeenCalled();
  });

  it("uses the configured URI and disables command buffering", async () => {
    const connectDB = await loadConnectDB("mongodb://127.0.0.1/dev-events");
    const connect = vi.spyOn(mongoose, "connect").mockResolvedValue(mongoose);

    await expect(connectDB()).resolves.toBe(mongoose);
    expect(connect).toHaveBeenCalledWith(
      "mongodb://127.0.0.1/dev-events",
      { bufferCommands: false },
    );
  });

  it("shares an in-flight connection and caches the resolved connection", async () => {
    const connectDB = await loadConnectDB("mongodb://127.0.0.1/dev-events");
    let resolveConnection!: (value: typeof mongoose) => void;
    const pendingConnection = new Promise<typeof mongoose>((resolve) => {
      resolveConnection = resolve;
    });
    const connect = vi
      .spyOn(mongoose, "connect")
      .mockReturnValue(pendingConnection);

    const first = connectDB();
    const second = connectDB();
    resolveConnection(mongoose);

    await expect(Promise.all([first, second])).resolves.toEqual([
      mongoose,
      mongoose,
    ]);
    await expect(connectDB()).resolves.toBe(mongoose);
    expect(connect).toHaveBeenCalledOnce();
  });

  it("clears a failed connection promise so a later call can retry", async () => {
    const connectDB = await loadConnectDB("mongodb://127.0.0.1/dev-events");
    const failure = new Error("connection refused");
    const connect = vi
      .spyOn(mongoose, "connect")
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(mongoose);

    await expect(connectDB()).rejects.toBe(failure);
    await expect(connectDB()).resolves.toBe(mongoose);
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it("reuses a connection already present in the global cache", async () => {
    delete globalThis.mongoose;
    vi.resetModules();
    vi.stubEnv("MONGODB_URI", "mongodb://127.0.0.1/dev-events");
    globalThis.mongoose = { conn: mongoose, promise: null };
    const connectDB = (await import("../../lib/mongodb")).default;
    const connect = vi.spyOn(mongoose, "connect");

    await expect(connectDB()).resolves.toBe(mongoose);
    expect(connect).not.toHaveBeenCalled();
  });
});
