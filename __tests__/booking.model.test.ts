import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Booking from "../database/booking.model";
import Event from "../database/event.model";

const validBooking = (overrides: Record<string, unknown> = {}) => ({
  eventId: new mongoose.Types.ObjectId(),
  email: "developer@example.com",
  ...overrides,
});

function mockEventLookup(result: object | null) {
  const select = vi.fn().mockResolvedValue(result);
  const findById = vi
    .spyOn(Event, "findById")
    .mockReturnValue({ select } as never);

  return { findById, select };
}

describe("Booking model", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Booking.collection, "insertOne").mockResolvedValue({
      acknowledged: true,
      insertedId: new mongoose.Types.ObjectId(),
    } as never);
    vi.spyOn(Booking.collection, "updateOne").mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    } as never);
  });

  it("normalizes email and verifies the referenced event before saving", async () => {
    const eventId = new mongoose.Types.ObjectId();
    const lookup = mockEventLookup({ _id: eventId });
    const booking = new Booking(
      validBooking({ eventId, email: "  Developer+Meetup@Example.COM  " }),
    );

    await booking.save();

    expect(booking.email).toBe("developer+meetup@example.com");
    expect(lookup.findById).toHaveBeenCalledWith(eventId);
    expect(lookup.select).toHaveBeenCalledWith("_id");
    expect(booking.createdAt).toBeInstanceOf(Date);
    expect(booking.updatedAt).toBeInstanceOf(Date);
  });

  it.each([
    "plain-address",
    "developer@-example.com",
    "developer@example..com",
    "developer example@example.com",
  ])("rejects invalid email %s", async (email) => {
    const booking = new Booking(validBooking({ email }));

    await expect(booking.validate()).rejects.toThrow(
      "Please provide a valid email address",
    );
  });

  it("requires both an event and an email", async () => {
    const booking = new Booking({});

    const error = await booking.validate().catch((caught) => caught);

    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(error.errors.eventId.message).toBe("Event ID is required");
    expect(error.errors.email.message).toBe("Email is required");
  });

  it("rejects a booking when the referenced event does not exist", async () => {
    const eventId = new mongoose.Types.ObjectId();
    mockEventLookup(null);
    const booking = new Booking(validBooking({ eventId }));

    await expect(booking.save()).rejects.toMatchObject({
      name: "ValidationError",
      message: `Event with ID ${eventId} does not exist`,
    });
    expect(Booking.collection.insertOne).not.toHaveBeenCalled();
  });

  it("converts event lookup failures into a stable validation error", async () => {
    vi.spyOn(Event, "findById").mockReturnValue({
      select: vi.fn().mockRejectedValue(new Error("database unavailable")),
    } as never);
    const booking = new Booking(validBooking());

    await expect(booking.save()).rejects.toMatchObject({
      name: "ValidationError",
      message: "Invalid events ID format or database error",
    });
    expect(Booking.collection.insertOne).not.toHaveBeenCalled();
  });

  it("does not repeat the event lookup when an existing booking keeps its event", async () => {
    const eventId = new mongoose.Types.ObjectId();
    const lookup = mockEventLookup({ _id: eventId });
    const booking = new Booking(validBooking({ eventId }));
    await booking.save();

    booking.email = "another@example.com";
    await booking.save();

    expect(lookup.findById).toHaveBeenCalledTimes(1);
    expect(Booking.collection.updateOne).toHaveBeenCalledTimes(1);
  });

  it("declares booking lookup indexes and one booking per event/email", () => {
    const indexes = Booking.schema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ eventId: 1 }, expect.any(Object)],
        [{ eventId: 1, createdAt: -1 }, expect.any(Object)],
        [{ email: 1 }, expect.any(Object)],
        [
          { eventId: 1, email: 1 },
          expect.objectContaining({ unique: true, name: "uniq_event_email" }),
        ],
      ]),
    );
  });
});
