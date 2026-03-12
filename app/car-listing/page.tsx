"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Car } from "../../types/car";
import CarInfoPage from "./CarInfoPage";
import NoCarPage from "./NoCarPage";

export default function ListingPage() {
    const searchParams = useSearchParams();

    const car = useMemo(() => {
        const rawCar = searchParams.get("carData");
        if (!rawCar) return null;

        try {
            return JSON.parse(rawCar) as Car;
        } catch {
            return null;
        }
    }, [searchParams]);

    if (!car) {
        return (
            <NoCarPage />
        );
    }

    return (
        <main className="min-h-screen bg-zinc-100 p-8 dark:bg-zinc-950">
            <CarInfoPage car={car} />
        </main>
    );
}
