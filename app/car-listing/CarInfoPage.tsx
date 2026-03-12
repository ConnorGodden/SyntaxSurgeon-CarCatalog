'use client';

import Link from "next/link";
import { Car } from "../../types/car";
import Image from "next/image";

export default function CarInfoPage({ car }: { car: Car }) {
    const imageSrc = car.image || "/cars/placeholder.svg";

    return (
        <div className="mx-auto max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {car.year} {car.make} {car.model}
            </h1>

            <div className="relative my-4 h-56 w-full overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-700 sm:h-72">
                <Image
                    src={imageSrc}
                    fill
                    sizes="(max-width: 640px) 100vw, 768px"
                    alt={`${car.year} ${car.make} ${car.model}`}
                    className="object-contain object-center"
                />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-zinc-700 dark:text-zinc-200 sm:grid-cols-2">
                <p><span className="font-semibold">Trim:</span> {car.trim ?? "N/A"}</p>
                <p><span className="font-semibold">Body:</span> {car.body}</p>
                <p><span className="font-semibold">Transmission:</span> {car.transmission ?? "N/A"}</p>
                <p><span className="font-semibold">Mileage:</span> {car.odometer.toLocaleString()} mi</p>
                <p><span className="font-semibold">Color:</span> {car.color}</p>
                <p><span className="font-semibold">Interior:</span> {car.interior}</p>
                <p><span className="font-semibold">VIN:</span> {car.vin}</p>
                <p><span className="font-semibold">State:</span> {car.state}</p>
                <p><span className="font-semibold">Condition:</span> {car.condition ?? "N/A"}</p>
                <p><span className="font-semibold">Seller:</span> {car.seller}</p>
                <p><span className="font-semibold">MMR:</span> ${car.mmr.toLocaleString()}</p>
                <p><span className="font-semibold">Price:</span> ${car.sellingprice.toLocaleString()}</p>
                <p><span className="font-semibold">Deal Rating:</span> {car.deal_rating}</p>
                <p><span className="font-semibold">Sale Date:</span> {car.saledate}</p>
            </div>

            <Link
                href="/"
                className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
                Back to catalog
            </Link>
        </div>
    )
}