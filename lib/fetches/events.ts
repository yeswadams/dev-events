import connectDB from "../mongodb";
import { Event } from "@/database/index";

export async function getEvents() {
  await connectDB();

  const events = await Event.find().sort({ createdAT: -1 }).lean(); // .lean() is useful here because you're rendering the result. You don't need full Mongoose documents with all their methods.

  return events.map((event) => ({
    ...event,
    _id: event._id.toString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  }));
}

export async function getEventBySlug(slug: string) {
  await connectDB();

  const event = await Event.findOne({ slug }).lean();

  if (!event) {
    return null;
  }


  return {
    ...event,
    _id: event._id.toString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

