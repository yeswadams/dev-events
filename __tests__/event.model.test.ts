import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Event from "../database/event.model";

const validEvent = (overrides: Record<string, unknown> = {}) => ({
  title: "TypeScript Summit",
  description: "A practical TypeScript conference",
  overview: "Talks and workshops for TypeScript developers",
  image: "https://example.com/event.png",
  venue: "Convention Center",
  location: "Accra, Ghana",
  date: "2026-09-20",
  time: "09:30",
  mode: "hybrid",
  audience: "Software developers",
  agenda: ["Keynote", "Workshops"],
  organizer: "Dev Events",
  tags: ["typescript", "web"],
  ...overrides,
});

describe("Event model", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Event.collection, "insertOne").mockResolvedValue({
      acknowledged: true,
      insertedId: new mongoose.Types.ObjectId(),
    } as never);
    vi.spyOn(Event.collection, "updateOne").mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    } as never);
  });

  it("normalizes event data and generates a URL-safe slug before saving", async () => {
    const event = new Event(
      validEvent({
        title: "  C++ && TypeScript--- Summit!  ",
        description: "  A practical conference  ",
        overview: "  Talks and workshops  ",
        venue: "  Main Hall  ",
        location: "  Accra  ",
        date: "September 20, 2026",
        time: " 9:05 pm ",
        audience: "  Developers  ",
        organizer: "  Dev Events  ",
      }),
    );

    await event.save();

    expect(event).toMatchObject({
      title: "C++ && TypeScript--- Summit!",
      slug: "c-typescript-summit",
      description: "A practical conference",
      overview: "Talks and workshops",
      venue: "Main Hall",
      location: "Accra",
      date: "2026-09-20",
      time: "21:05",
      audience: "Developers",
      organizer: "Dev Events",
    });
    expect(event.createdAt).toBeInstanceOf(Date);
    expect(event.updatedAt).toBeInstanceOf(Date);
  });

  it.each([
    ["12:00 AM", "00:00"],
    ["12:00 PM", "12:00"],
    ["1:07 am", "01:07"],
    ["11:59 PM", "23:59"],
    ["0:05", "00:05"],
    ["23:59", "23:59"],
  ])("normalizes the time boundary %s to %s", async (input, expected) => {
    const event = new Event(validEvent({ time: input }));

    await event.save();

    expect(event.time).toBe(expected);
  });

  it.each([
    ["not-a-time", "Invalid time format. Use HH:MM or HH:MM AM/PM"],
    ["24:00", "Invalid time values"],
    ["12:60", "Invalid time values"],
  ])("rejects invalid time %s", async (time, message) => {
    const event = new Event(validEvent({ time }));

    await expect(event.save()).rejects.toThrow(message);
    expect(Event.collection.insertOne).not.toHaveBeenCalled();
  });

  it("rejects a date that cannot be normalized", async () => {
    const event = new Event(validEvent({ date: "definitely-not-a-date" }));

    await expect(event.save()).rejects.toThrow("Invalid date format");
    expect(Event.collection.insertOne).not.toHaveBeenCalled();
  });

  it("regenerates the slug only when the title changes", async () => {
    const event = new Event(validEvent());
    await event.save();

    event.slug = "curated-slug";
    event.date = "2026-10-01";
    await event.save();
    expect(event.slug).toBe("curated-slug");

    event.title = "A New Event Title";
    await event.save();
    expect(event.slug).toBe("a-new-event-title");
  });

  it.each([
    ["title", "x".repeat(101), "Title cannot exceed 100 characters"],
    [
      "description",
      "x".repeat(1001),
      "Description cannot exceed 1000 characters",
    ],
    ["overview", "x".repeat(501), "Overview cannot exceed 500 characters"],
    ["mode", "virtual", "Mode must be either online, offline, or hybrid"],
    ["agenda", [], "At least one agenda item is required"],
    ["tags", [], "At least one tag is required"],
  ])("validates %s", async (field, value, message) => {
    const event = new Event(validEvent({ [field]: value }));

    await expect(event.validate()).rejects.toThrow(message);
  });

  it("reports every missing required scalar field in one validation pass", async () => {
    const event = new Event({ agenda: ["Keynote"], tags: ["typescript"] });

    const error = await event.validate().catch((caught) => caught);

    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(Object.keys(error.errors).sort()).toEqual(
      [
        "audience",
        "date",
        "description",
        "image",
        "location",
        "mode",
        "organizer",
        "overview",
        "time",
        "title",
        "venue",
      ].sort(),
    );
  });

  it("accepts exact maximum-length boundaries", async () => {
    const event = new Event(
      validEvent({
        title: "x".repeat(100),
        description: "x".repeat(1000),
        overview: "x".repeat(500),
      }),
    );

    await expect(event.validate()).resolves.toBeUndefined();
  });

  it("declares the lookup and uniqueness indexes used by event queries", () => {
    const indexes = Event.schema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ slug: 1 }, expect.objectContaining({ unique: true })],
        [{ date: 1, mode: 1 }, expect.any(Object)],
      ]),
    );
  });
});
