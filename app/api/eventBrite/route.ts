import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-community';

// Create prisma client outside the handler to reuse connections
// This is important for serverless environments like Vercel
declare global {
  var prisma: PrismaClient | undefined;
}
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances during development hot reloading
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

interface RawEventResult {
  event_id: string;
  event_name: string;
  event_description: string;
  start_datetime: Date;
  end_datetime: Date;
  event_url: string | null;
  organizer_name: string;
  logo_url: string | null;
  category_name: string;
  venue_latitude: number;
  venue_longitude: number;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  distance: number;
}

export async function GET(request: Request) {
  try {
    console.log('Fetching events...');
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    
    // Validate parameters
    if (!latParam || !lngParam) {
      return NextResponse.json(
        { error: 'Missing required parameters: lat and lng' },
        { status: 400 }
      );
    }
    
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    
    // Validate parameter values
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates: lat and lng must be numbers' },
        { status: 400 }
      );
    }
    
    console.log(`Processing request for coordinates: ${lat}, ${lng}`);
    const radius = 20; // 20km radius

    // Check database connection before query
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: process.env.NODE_ENV === 'development' ? 
          (dbError instanceof Error ? dbError.message : String(dbError)) : undefined },
        { status: 503 }
      );
    }

    // Using raw SQL query with Prisma
    const events = await prisma.$queryRaw<RawEventResult[]>`
      WITH events_with_distance AS (
        SELECT 
          e.event_id,
          e.event_name,
          e.event_description,
          e.start_datetime,
          e.end_datetime,
          e.event_url,
          o.organizer_name,
          l.logo_url,
          c.category_name,
          v.venue_latitude,
          v.venue_longitude,
          v.venue_name,
          v.venue_address,
          v.venue_city,
          (
            6371 * acos(
              cos(radians(${lat})) * cos(radians(v.venue_latitude)) *
              cos(radians(v.venue_longitude) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(v.venue_latitude))
            )
          ) as distance
        FROM "community_events"."Event" AS e
        JOIN "community_events"."Category" c ON e.category_id = c.category_id
        JOIN "community_events"."Venue" v ON e.venue_id = v.venue_id
        JOIN "community_events"."Organizer" o ON e.organizer_id = o.organizer_id
        LEFT JOIN "community_events"."Logo" l ON e.logo_id = l.logo_id
        WHERE e.event_status = 'live'
      )
      SELECT *
      FROM events_with_distance
      WHERE distance <= ${radius}
      ORDER BY distance;
    `;

    console.log(`Found ${events.length} events within ${radius}km radius`);

    // Transform the raw SQL results to match the Event interface
    const formattedEvents = events.map((event) => ({
      id: event.event_id,
      name: event.event_name,
      description: event.event_description,
      url: event.event_url || '',
      start: {
        local: event.start_datetime.toISOString(),
      },
      end: {
        local: event.end_datetime.toISOString(),
      },
      venue: {
        name: event.venue_name,
        address: {
          localized_address_display: `${event.venue_address}, ${event.venue_city}`,
        },
        location: {
          latitude: event.venue_latitude,
          longitude: event.venue_longitude
        }
      },
      logo: event.logo_url ? {
        url: event.logo_url,
      } : undefined,
      distance: Math.round(event.distance * 10) / 10 // Round to 1 decimal place
    }));
    
    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    // Include more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to fetch events',
        message: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  } finally {
    // No need to disconnect in serverless environments
    // Connections are automatically cleaned up
  }
}
