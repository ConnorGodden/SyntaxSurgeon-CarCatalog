import { Car } from "../types/car";

export interface DuplicateResult {
  isDuplicate: boolean;
  similarCars: Car[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Detects potential duplicate car listings based on various criteria
 * @param newCar The car being added or checked
 * @param existingCars Array of existing cars to check against
 * @returns DuplicateResult indicating if duplicates were found and their confidence level
 */
export function detectDuplicates(newCar: Car, existingCars: Car[]): DuplicateResult {
  const similarCars: Car[] = [];
  let highConfidenceCount = 0;
  let mediumConfidenceCount = 0;

  for (const existingCar of existingCars) {
    const similarity = calculateSimilarity(newCar, existingCar);

    if (similarity >= 0.8) {
      similarCars.push(existingCar);
      highConfidenceCount++;
    } else if (similarity >= 0.6) {
      similarCars.push(existingCar);
      mediumConfidenceCount++;
    }
  }

  const isDuplicate = similarCars.length > 0;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (highConfidenceCount > 0) {
    confidence = 'high';
  } else if (mediumConfidenceCount > 0) {
    confidence = 'medium';
  }

  return {
    isDuplicate,
    similarCars,
    confidence
  };
}

/**
 * Calculates similarity score between two cars (0-1, where 1 is identical)
 */
function calculateSimilarity(car1: Car, car2: Car): number {
  let score = 0;
  let totalWeight = 0;

  // VIN match (highest weight - 40%)
  if (car1.vin && car2.vin && car1.vin.trim() && car2.vin.trim()) {
    totalWeight += 40;
    if (car1.vin.toLowerCase() === car2.vin.toLowerCase()) {
      score += 40;
    } else if (car1.vin.toLowerCase().includes(car2.vin.toLowerCase()) ||
               car2.vin.toLowerCase().includes(car1.vin.toLowerCase())) {
      score += 20; // Partial VIN match
    }
  }

  // Make and Model match (30% weight)
  totalWeight += 30;
  if (car1.make.toLowerCase() === car2.make.toLowerCase() &&
      car1.model.toLowerCase() === car2.model.toLowerCase()) {
    score += 30;
  } else if (car1.make.toLowerCase() === car2.make.toLowerCase()) {
    score += 15; // Same make, different model
  }

  // Year match (15% weight)
  totalWeight += 15;
  if (car1.year === car2.year) {
    score += 15;
  } else if (Math.abs(car1.year - car2.year) <= 1) {
    score += 7.5; // Within 1 year
  }

  // Price similarity (10% weight)
  totalWeight += 10;
  const priceDiff = Math.abs(car1.sellingprice - car2.sellingprice);
  const avgPrice = (car1.sellingprice + car2.sellingprice) / 2;
  if (avgPrice > 0) {
    const priceSimilarity = 1 - (priceDiff / avgPrice);
    if (priceSimilarity > 0.9) score += 10;
    else if (priceSimilarity > 0.8) score += 7.5;
    else if (priceSimilarity > 0.7) score += 5;
  }

  // Mileage similarity (5% weight)
  totalWeight += 5;
  const mileageDiff = Math.abs(car1.odometer - car2.odometer);
  const avgMileage = (car1.odometer + car2.odometer) / 2;
  if (avgMileage > 0) {
    const mileageSimilarity = 1 - (mileageDiff / avgMileage);
    if (mileageSimilarity > 0.9) score += 5;
    else if (mileageSimilarity > 0.8) score += 3.75;
    else if (mileageSimilarity > 0.7) score += 2.5;
  }

  return totalWeight > 0 ? score / totalWeight : 0;
}

/**
 * Finds all duplicate groups in the catalog
 * @param cars Array of all cars
 * @returns Array of duplicate groups, each containing similar cars
 */
export function findAllDuplicates(cars: Car[]): Car[][] {
  const duplicateGroups: Car[][] = [];
  const processed = new Set<string>();

  for (let i = 0; i < cars.length; i++) {
    const car1 = cars[i];
    const car1Key = `${car1.vin || i}`;

    if (processed.has(car1Key)) continue;

    const group: Car[] = [car1];
    processed.add(car1Key);

    for (let j = i + 1; j < cars.length; j++) {
      const car2 = cars[j];
      const car2Key = `${car2.vin || j}`;

      if (processed.has(car2Key)) continue;

      const similarity = calculateSimilarity(car1, car2);
      if (similarity >= 0.6) { // Medium confidence threshold for grouping
        group.push(car2);
        processed.add(car2Key);
      }
    }

    if (group.length > 1) {
      duplicateGroups.push(group);
    }
  }

  return duplicateGroups;
}