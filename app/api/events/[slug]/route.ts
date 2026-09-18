import connectDB from "@/lib/mongodb";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { Event } from "@/database/index";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  try {
    await connectDB();
    const { slug } = await params;

    if (!slug || typeof slug !== "string" || slug.trim() == "") {
      return NextResponse.json({ message: "Invalid or missing url parameter" });
    }

    const sanitizedSlug: string = slug.trim().toLowerCase();

    const event = await Event.find({ slug: sanitizedSlug }).lean();

    if (!event) {
      return NextResponse.json(
        { message: `Event of the slug: '${sanitizedSlug}' not found` },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Event fetched successfully", event },
      { status: 200 },
    );
  } catch (error) {
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching events by slug:", error);
    }

    // Handle specific error types
    if (error instanceof Error) {
      // Handle database connection errors
      if (error.message.includes("MONGODB_URI")) {
        return NextResponse.json(
          { message: "Database configuration error" },
          { status: 500 },
        );
      }

      // Return generic error with error message
      return NextResponse.json(
        { message: "Failed to fetch events", error: error.message },
        { status: 500 },
      );
    }

    // Handle unknown errors
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
