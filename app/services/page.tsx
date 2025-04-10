"use client";

import Navbar from "@/app/components/Navbar";
import PopularServices from "@/app/components/PopularServices";

export default function ServicesPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />
            <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 text-center mb-12">
                        Services
                    </h1>
                    <p className="text-lg text-gray-600 text-center">
                        Services coming soon...
                    </p>
                </div>
            </section>
            <PopularServices />
        </main>
    );
}
