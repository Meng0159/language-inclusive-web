"use client";

import { useQuery } from "@tanstack/react-query";
import EventCard from "./EventCard";

interface Coordinates {
    lat: number;
    lng: number;
}

interface Event {
    id: string;
    name: string;
    description: string;
    url: string;
    start: {
        local: string;
    };
    end: {
        local: string;
    };
    venue: {
        name: string;
        address: {
            localized_address_display: string;
        };
    };
    logo?: {
        url: string;
    };
}

interface EventListProps {
    coordinates: Coordinates | null;
    events: Event[];
    isLoading: boolean;
}

function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
                <div
                    key={index}
                    className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse"
                >
                    <div className="h-48 bg-gray-200" />
                    <div className="p-4 space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-3/4" />
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                            <div className="h-4 bg-gray-200 rounded w-2/3" />
                        </div>
                        <div className="h-10 bg-gray-200 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function EventList({
    coordinates,
    events,
    isLoading,
}: EventListProps) {
    if (!coordinates) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                    <svg
                        className="w-12 h-12 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Select a Location
                </h2>
                <p className="text-gray-600">
                    Choose a location to find events near you.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!events.length) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                    <svg
                        className="w-12 h-12 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    No Events Found
                </h2>
                <p className="text-gray-600">
                    Try adjusting your search or location to find events.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {events.map((event) => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    );
}
