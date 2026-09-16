import { describe, expect, it } from "vitest";

import { Booking, Event } from "../database";
import BookingModel from "../database/booking.model";
import EventModel from "../database/event.model";

describe("database model exports", () => {
  it("exposes the compiled Event and Booking models from the database entry point", () => {
    expect(Event).toBe(EventModel);
    expect(Booking).toBe(BookingModel);
  });
});
