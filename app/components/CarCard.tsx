import { Car } from "../../types/car";
import Image from "next/image";

const imageSrc = (car: Car) => car.image?.trim() || "/cars/placeholder.svg";
const isDataUrl = (src: string) => src.startsWith("data:");

export default function CarCard({ car }: { car: Car }) {
    const src = imageSrc(car);
    return (
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 w-full h-100">
        <div className="relative mb-3 h-36 w-full overflow-hidden rounded-md">
          {isDataUrl(src) ? (
            <img
              src={src}
              alt={`${car.make} ${car.model}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src={src}
              alt={`${car.make} ${car.model}`}
              fill
              sizes="(max-width: 500px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
        <h2 className="text-base font-semibold">{car.make}</h2>
        <p className="text-sm text-zinc-500">{car.model}</p>
        <p className="mt-1 text-zinc-500">{car.year}</p>
        <p className="mt-2 text-sm">Rating: {car.deal_rating}</p>
      </div>
    );
  }
