import { Car } from "./car";

export function cleanSelection(cars: Car[], selections: Record<string, string>): Car[] {
    return cars.filter(car => {
        for (const key in selections) {
            if (selections[key] && car[key as keyof Car] !== selections[key]) {
                return false;
            }
        }
        return true;
    });
}