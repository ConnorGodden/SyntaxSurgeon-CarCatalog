import { Car } from "../../types/car";
import Image from "next/image";

export default function CarCard({ car }: { car: Car }) {
    return (
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="relative mb-3 h-36 w-full overflow-hidden rounded-md">
          <Image
            src={car.image?.trim() || "/cars/placeholder.svg"}
            alt={`${car.make} ${car.model}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <h2 className="text-base font-semibold">{car.make}</h2>
        <p className="text-sm text-zinc-500">{car.model}</p>
        <p className="mt-1 text-zinc-500">{car.year}</p>
        <p className="mt-2 text-sm">Rating: {car.deal_rating}</p>
      </div>
    );
  }
  