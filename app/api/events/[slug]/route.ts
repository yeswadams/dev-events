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

    const event = await Event.find();
  } catch (error) {}
}
