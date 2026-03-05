import { Car } from "./car";

export function cleanSelection(cars: Car[], selections: Record<string, string>): Car[] {
    return cars.filter(car => {
        for (const key in selections) {
            if (!selections[key]) continue;
            const carVal = car[key as keyof Car];
            const selVal = selections[key];
            // Normalize for comparison (condition can be number from CSV or string from new listings)
            const carStr = carVal == null ? "" : String(carVal);
            if (carStr !== selVal) return false;
        }
        return true;
    });
}