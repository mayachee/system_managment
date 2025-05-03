import { db } from '../db';
import { eq } from 'drizzle-orm';
import { carFeatures, type CarFeatures } from '@shared/schema';

/**
 * Get car features by car ID
 */
export async function getCarFeatures(carId: number): Promise<CarFeatures | undefined> {
  try {
    const [features] = await db
      .select()
      .from(carFeatures)
      .where(eq(carFeatures.carId, carId));
    
    return features;
  } catch (error) {
    console.error('Error getting car features:', error);
    throw error;
  }
}

/**
 * Create car features
 */
export async function createCarFeatures(data: Omit<CarFeatures, 'id'>): Promise<CarFeatures> {
  try {
    const [newFeatures] = await db
      .insert(carFeatures)
      .values(data)
      .returning();
    
    return newFeatures;
  } catch (error) {
    console.error('Error creating car features:', error);
    throw error;
  }
}

/**
 * Update car features
 */
export async function updateCarFeatures(
  carId: number, 
  data: Partial<Omit<CarFeatures, 'id' | 'carId'>>
): Promise<CarFeatures | undefined> {
  try {
    const [updatedFeatures] = await db
      .update(carFeatures)
      .set(data)
      .where(eq(carFeatures.carId, carId))
      .returning();
    
    return updatedFeatures;
  } catch (error) {
    console.error('Error updating car features:', error);
    throw error;
  }
}

/**
 * Get or create car features
 */
export async function getOrCreateCarFeatures(carId: number): Promise<CarFeatures> {
  try {
    let features = await getCarFeatures(carId);
    
    if (!features) {
      // Create default features
      features = await createCarFeatures({
        carId,
        fuelType: 'Unknown',
        transmission: 'Unknown',
        seating: 0,
        doors: 0,
        mpg: 0,
        trunkSpace: 0,
        hasGPS: false,
        hasBluetoothAudio: false,
        hasSunroof: false,
        hasLeatherSeats: false,
        hasBackupCamera: false,
        features: {},
        additionalImages: [],
      });
    }
    
    return features;
  } catch (error) {
    console.error('Error getting or creating car features:', error);
    throw error;
  }
}