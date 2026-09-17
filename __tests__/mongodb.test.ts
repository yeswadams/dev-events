import { afterEach, describe, expect, it, vi } from "vitest";

const originalUri = process.env.MONGODB_URI;

type FakeMongoose = {
  connect: ReturnType<typeof vi.fn>;
};

async function loadConnectDB(options: {
  uri?: string;
  cachedConnection?: object;
} = {}) {
  vi.resetModules();
  vi.doUnmock("mongoose");
  delete (globalThis as Record<string, unknown>).mongoose;

  if (options.uri === undefined) {
    delete process.env.MONGODB_URI;
  } else {
    process.env.MONGODB_URI = options.uri;
  }

  const mongoose: FakeMongoose = { connect: vi.fn() };
  vi.doMock("mongoose", () => ({ default: mongoose }));

  if (options.cachedConnection) {
    (globalThis as Record<string, unknown>).mongoose = {
      conn: options.cachedConnection,
      promise: null,
    };
  }

  const { default: connectDB } = await import("../lib/mongodb");
  return { connectDB, mongoose };
}

afterEach(() => {
  vi.doUnmock("mongoose");
  vi.resetModules();
  delete (globalThis as Record<string, unknown>).mongoose;

  if (originalUri === undefined) {
    delete process.env.MONGODB_URI;
  } else {
    process.env.MONGODB_URI = originalUri;
  }
});

describe("connectDB", () => {
  it("fails clearly without MONGODB_URI and never attempts a connection", async () => {
    const { connectDB, mongoose } = await loadConnectDB();

    await expect(connectDB()).rejects.toThrow(
      "Please define the MONGODB_URI environment variable inside .env.local",
    );
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  it("connects with buffering disabled and reuses the resolved connection", async () => {
    const uri = "mongodb://127.0.0.1:27017/dev-events-test";
    const { connectDB, mongoose } = await loadConnectDB({ uri });
    mongoose.connect.mockResolvedValue(mongoose);

    await expect(connectDB()).resolves.toBe(mongoose);
    await expect(connectDB()).resolves.toBe(mongoose);

    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect).toHaveBeenCalledWith(uri, {
      bufferCommands: false,
    });
  });

  it("shares one in-flight connection attempt across concurrent callers", async () => {
    const { connectDB, mongoose } = await loadConnectDB({
      uri: "mongodb://127.0.0.1:27017/dev-events-test",
    });
    let resolveConnection!: (value: FakeMongoose) => void;
    mongoose.connect.mockReturnValue(
      new Promise<FakeMongoose>((resolve) => {
        resolveConnection = resolve;
      }),
    );

    const first = connectDB();
    const second = connectDB();

    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    resolveConnection(mongoose);
    await expect(Promise.all([first, second])).resolves.toEqual([
      mongoose,
      mongoose,
    ]);
  });

  it("clears a rejected promise so a later call can retry", async () => {
    const { connectDB, mongoose } = await loadConnectDB({
      uri: "mongodb://127.0.0.1:27017/dev-events-test",
    });
    const initialFailure = new Error("connection refused");
    mongoose.connect
      .mockRejectedValueOnce(initialFailure)
      .mockResolvedValueOnce(mongoose);

    await expect(connectDB()).rejects.toBe(initialFailure);
    await expect(connectDB()).resolves.toBe(mongoose);
    expect(mongoose.connect).toHaveBeenCalledTimes(2);
  });

  it("uses an existing global connection without reading credentials", async () => {
    const existingConnection = { id: "existing-connection" };
    const { connectDB, mongoose } = await loadConnectDB({
      cachedConnection: existingConnection,
    });

    await expect(connectDB()).resolves.toBe(existingConnection);
    expect(mongoose.connect).not.toHaveBeenCalled();
  });
});
