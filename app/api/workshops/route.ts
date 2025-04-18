import { NextResponse } from "next/server";
import { prismaEnglish } from "@/lib/prisma";

interface Workshop {
    id: string;
    name: string;
    provider_name: string;
    url: string;
    location: {
        latitude: number;
        longitude: number;
    };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = parseFloat(searchParams.get("lat") || "0");
        const lng = parseFloat(searchParams.get("lng") || "0");
        const radius = 20; // 20km radius

        // Using Prisma's query builder with relations
        const workshops = await prismaEnglish.provider.findMany({
            where: {
                courses: {
                    some: {
                        OR: [
                            { qualification_level: { contains: "English" } },
                            { course_title: { contains: "English" } },
                            { course_code: { contains: "ENG" } },
                        ],
                    },
                },
            },
            include: {
                locations: true,
                courses: {
                    where: {
                        OR: [
                            { qualification_level: { contains: "English" } },
                            { course_title: { contains: "English" } },
                            { course_code: { contains: "ENG" } },
                        ],
                    },
                },
            },
        });

        // Filter and format workshops based on distance
        const formattedWorkshops: Workshop[] = [];

        workshops.forEach((provider) => {
            provider.locations.forEach((location) => {
                const distance = calculateDistance(
                    lat,
                    lng,
                    location.latitude,
                    location.longitude
                );

                if (distance <= radius) {
                    provider.courses.forEach((course) => {
                        formattedWorkshops.push({
                            id: `${provider.provider_id}${location.geographic_id}${course.course_id}`,
                            name: course.course_title,
                            provider_name: provider.provider_name,
                            url: provider.url || "",
                            location: {
                                latitude: location.latitude,
                                longitude: location.longitude,
                            },
                        });
                    });
                }
            });
        });

        // Sort by distance
        formattedWorkshops.sort((a, b) => {
            const distanceA = calculateDistance(
                lat,
                lng,
                a.location.latitude,
                a.location.longitude
            );
            const distanceB = calculateDistance(
                lat,
                lng,
                b.location.latitude,
                b.location.longitude
            );
            return distanceA - distanceB;
        });

        return NextResponse.json(formattedWorkshops);
    } catch (error) {
        console.error("Error fetching workshops:", error);
        return NextResponse.json(
            { error: "Failed to fetch workshops" },
            { status: 500 }
        );
    }
}

// Function to calculate distance between two coordinates using Haversine formula
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
