import { Car } from "../../types/car";
import Image from "next/image";

const imageSrc = (car: Car) => car.image?.trim() || "/cars/placeholder.svg";
const isDataUrl = (src: string) => src.startsWith("data:");

export default function CarCard({ car, isDuplicate = false }: { car: Car; isDuplicate?: boolean }) {
    const src = imageSrc(car);
    return (
      <div className={`rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 w-full h-100 relative ${isDuplicate ? 'ring-2 ring-amber-400' : ''}`}>
        {isDuplicate && (
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Duplicate
            </div>
          </div>
        )}
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
              sizes="(max-width: 768px) 100vw, 50vw"
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
