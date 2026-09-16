import { Types } from "mongoose";
import { afterEach, describe, expect, it, vi } from "vitest";

import Booking from "../../database/booking.model";
import Event from "../../database/event.model";
import { Booking as ExportedBooking, Event as ExportedEvent } from "../../database";

type SaveHookRunner = {
  execPre: (
    name: string,
    context: InstanceType<typeof Booking>,
    args: unknown[],
  ) => Promise<unknown[]>;
};

async function runBookingValidationHook(
  booking: InstanceType<typeof Booking>,
) {
  const next = vi.fn();
  const hooks = (
    Booking.schema as typeof Booking.schema & { s: { hooks: SaveHookRunner } }
  ).s.hooks;

  await hooks.execPre("save", booking, [next]);
  return next;
}

describe("Booking model", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts a valid booking and canonicalizes the email", async () => {
    const booking = new Booking({
      eventId: new Types.ObjectId(),
      email: "  DEVELOPER@Example.COM  ",
    });

    await expect(booking.validate()).resolves.toBeUndefined();
    expect(booking.email).toBe("developer@example.com");
  });

  it("exposes both models from the database entry point", () => {
    expect(ExportedEvent).toBe(Event);
    expect(ExportedBooking).toBe(Booking);
  });

  it.each([
    ["eventId", "Event ID is required"],
    ["email", "Email is required"],
  ] as const)("requires %s", async (field, message) => {
    const data: Record<string, unknown> = {
      eventId: new Types.ObjectId(),
      email: "developer@example.com",
    };
    delete data[field];

    await expect(new Booking(data).validate()).rejects.toMatchObject({
      errors: { [field]: { message } },
    });
  });

  it.each([
    "not-an-email",
    "developer@-example.com",
    "developer@example..com",
  ])("rejects invalid email %s", async (email) => {
    await expect(
      new Booking({ eventId: new Types.ObjectId(), email }).validate(),
    ).rejects.toMatchObject({
      errors: { email: { message: "Please provide a valid email address" } },
    });
  });

  it("continues saving when the referenced event exists", async () => {
    const eventId = new Types.ObjectId();
    const select = vi.fn().mockResolvedValue({ _id: eventId });
    vi.spyOn(Event, "findById").mockReturnValue({ select } as never);

    const next = await runBookingValidationHook(
      new Booking({ eventId, email: "developer@example.com" }),
    );

    expect(Event.findById).toHaveBeenCalledWith(eventId);
    expect(select).toHaveBeenCalledWith("_id");
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it("returns a validation error when the referenced event is missing", async () => {
    const eventId = new Types.ObjectId();
    const select = vi.fn().mockResolvedValue(null);
    vi.spyOn(Event, "findById").mockReturnValue({ select } as never);

    const next = await runBookingValidationHook(
      new Booking({ eventId, email: "developer@example.com" }),
    );

    const error = next.mock.calls[0][0] as Error;
    expect(error).toMatchObject({
      name: "ValidationError",
      message: `Event with ID ${eventId} does not exist`,
    });
  });

  it("hides lookup failures behind a stable validation error", async () => {
    const select = vi.fn().mockRejectedValue(new Error("database unavailable"));
    vi.spyOn(Event, "findById").mockReturnValue({ select } as never);

    const next = await runBookingValidationHook(
      new Booking({
        eventId: new Types.ObjectId(),
        email: "developer@example.com",
      }),
    );

    expect(next.mock.calls[0][0]).toMatchObject({
      name: "ValidationError",
      message: "Invalid events ID format or database error",
    });
  });

  it("skips the event lookup when eventId is unchanged", async () => {
    const findById = vi.spyOn(Event, "findById");
    const booking = new Booking({
      eventId: new Types.ObjectId(),
      email: "developer@example.com",
    });
    booking.$isNew = false;
    booking.unmarkModified("eventId");

    const next = await runBookingValidationHook(booking);

    expect(findById).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("declares lookup indexes and the unique event-email constraint", () => {
    expect(Booking.schema.indexes()).toEqual(
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
