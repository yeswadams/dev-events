"use server";

import { Event } from "@/database";
import connectDB from "@/lib/mongodb";

export const getSimilarEventsBySlug = async (slug: string) => {
  await connectDB();

  const event = await Event.findOne({ slug }).lean();

  if (!event) {
    return [];
  }

  const similarEvents = await Event.find({
    _id: { $ne: event._id },
    tags: { $in: event.tags },
  })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  return similarEvents.map((event) => ({
    ...event,
    _id: event._id.toString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  }));
};
