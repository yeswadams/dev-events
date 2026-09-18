import { describe, expect, it } from "vitest";

import Event from "../../database/event.model";

const validEvent = {
  title: "TypeScript Summit",
  description: "A conference for TypeScript developers.",
  overview: "Talks and workshops about TypeScript.",
  image: "https://example.com/event.png",
  venue: "Convention Center",
  location: "London",
  date: "2026-09-16",
  time: "09:30",
  mode: "hybrid",
  audience: "Software developers",
  agenda: ["Keynote", "Workshops"],
  organizer: "Dev Events",
  tags: ["typescript", "web"],
};

type SaveHookRunner = {
  execPre: (
    name: string,
    context: InstanceType<typeof Event>,
    args: unknown[],
  ) => Promise<unknown[]>;
};

async function runSaveHooks(event: InstanceType<typeof Event>) {
  const hooks = (
    Event.schema as typeof Event.schema & { s: { hooks: SaveHookRunner } }
  ).s.hooks;

  await hooks.execPre("save", event, [{}]);
}

describe("Event model", () => {
  it("accepts a complete event and applies string trimming", async () => {
    const event = new Event({
      ...validEvent,
      title: "  TypeScript Summit  ",
      venue: "  Convention Center  ",
      organizer: "  Dev Events  ",
    });

    await expect(event.validate()).resolves.toBeUndefined();
    expect(event.title).toBe("TypeScript Summit");
    expect(event.venue).toBe("Convention Center");
    expect(event.organizer).toBe("Dev Events");
  });

  it.each([
    ["title", "Title is required"],
    ["description", "Description is required"],
    ["overview", "Overview is required"],
    ["image", "Image URL is required"],
    ["venue", "Venue is required"],
    ["location", "Location is required"],
    ["date", "Date is required"],
    ["time", "Time is required"],
    ["mode", "Mode is required"],
    ["audience", "Audience is required"],
    ["organizer", "Organizer is required"],
  ] as const)("requires %s", async (field, message) => {
    const data: Record<string, unknown> = { ...validEvent };
    delete data[field];

    const validation = new Event(data).validate();

    await expect(validation).rejects.toMatchObject({
      errors: { [field]: { message } },
    });
  });

  it.each([
    ["agenda", "At least one agenda item is required"],
    ["tags", "At least one tag is required"],
  ] as const)("rejects an empty %s array", async (field, message) => {
    const validation = new Event({ ...validEvent, [field]: [] }).validate();

    await expect(validation).rejects.toMatchObject({
      errors: { [field]: { message } },
    });
  });

  it.each([
    ["title", 100, "Title cannot exceed 100 characters"],
    ["description", 1000, "Description cannot exceed 1000 characters"],
    ["overview", 500, "Overview cannot exceed 500 characters"],
  ] as const)(
    "enforces the %s maximum length boundary",
    async (field, maximum, message) => {
      await expect(
        new Event({ ...validEvent, [field]: "x".repeat(maximum) }).validate(),
      ).resolves.toBeUndefined();

      await expect(
        new Event({
          ...validEvent,
          [field]: "x".repeat(maximum + 1),
        }).validate(),
      ).rejects.toMatchObject({ errors: { [field]: { message } } });
    },
  );

  it.each(["online", "offline", "hybrid"])(
    "accepts the %s event mode",
    async (mode) => {
      await expect(
        new Event({ ...validEvent, mode }).validate(),
      ).resolves.toBeUndefined();
    },
  );

  it("rejects an unsupported event mode", async () => {
    await expect(
      new Event({ ...validEvent, mode: "in-person" }).validate(),
    ).rejects.toMatchObject({
      errors: {
        mode: { message: "Mode must be either online, offline, or hybrid" },
      },
    });
  });

  it("generates a URL-safe slug and normalizes date and time before save", async () => {
    const event = new Event({
      ...validEvent,
      title: "  C++ & Node.js -- Live!  ",
      time: "9:05 PM",
    });

    await runSaveHooks(event);

    expect(event.slug).toBe("c-nodejs-live");
    expect(event.date).toBe("2026-09-16");
    expect(event.time).toBe("21:05");
  });

  it.each([
    ["12:00 AM", "00:00"],
    ["12:00 PM", "12:00"],
    ["7:05 AM", "07:05"],
    ["23:59", "23:59"],
  ])("normalizes %s to %s", async (input, expected) => {
    const event = new Event({ ...validEvent, time: input });

    await runSaveHooks(event);

    expect(event.time).toBe(expected);
  });

  it.each(["24:00", "09:60", "9 PM", "not-a-time"])(
    "rejects invalid time %s",
    async (time) => {
      await expect(
        runSaveHooks(new Event({ ...validEvent, time })),
      ).rejects.toThrow();
    },
  );

  it("rejects an unparseable date", async () => {
    await expect(
      runSaveHooks(new Event({ ...validEvent, date: "not-a-date" })),
    ).rejects.toThrow("Invalid date format");
  });

  it("does not regenerate normalized fields when they are unchanged", async () => {
    const event = new Event({
      ...validEvent,
      slug: "stable-slug",
      date: "2026-09-16",
      time: "09:30",
    });
    event.$isNew = false;
    event.unmarkModified("title");
    event.unmarkModified("date");
    event.unmarkModified("time");

    await runSaveHooks(event);

    expect(event.slug).toBe("stable-slug");
    expect(event.date).toBe("2026-09-16");
    expect(event.time).toBe("09:30");
  });

  it("declares the unique slug and date-mode query indexes", () => {
    expect(Event.schema.indexes()).toEqual(
      expect.arrayContaining([
        [{ slug: 1 }, expect.objectContaining({ unique: true })],
        [{ date: 1, mode: 1 }, expect.any(Object)],
      ]),
    );
  });
});
