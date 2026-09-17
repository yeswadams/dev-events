import connectDB from "@/lib/mongodb";
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from "next/server";
import { Event } from "@/database/index";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData(); // in express it would have been req.body()

    let event;
    try {
        event = Object.fromEntries(formData.entries());
    } catch(e) {
        return NextResponse.json(
          {
            message: 'Invalid JSON data format', 
            error: e instanceof Error ? e.message : "Failed to create the Event"
          }, 
          { status: 400 }
        );
    };

    const file = formData.get('image')  as File;

    if(!file) {
      return NextResponse.json({ message: 'Image file is required'}, {status: 400})
    };

    const createdEvent = await Event.create(event);
    
    const buffer = Buffer.from(arrayBuffer);

    return NextResponse.json(
      { 
        message: 'Event created successfully', 
        event: createdEvent 
      }, 
      { status: 201 }
    );
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      {
        message: "Event Creation Failed",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 },
    );
  };
};
