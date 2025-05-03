import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { carMaintenance, cars } from "@shared/schema";
import { addDays } from "date-fns";

// Get all maintenance records
export async function getMaintenanceRecords() {
  try {
    const records = await db
      .select()
      .from(carMaintenance)
      .orderBy(carMaintenance.serviceDate);
    
    return records;
  } catch (error) {
    console.error("Error fetching maintenance records:", error);
    throw error;
  }
}

// Get a single maintenance record by ID
export async function getMaintenanceRecordById(id: number) {
  try {
    const [record] = await db
      .select()
      .from(carMaintenance)
      .where(eq(carMaintenance.id, id));
    
    return record;
  } catch (error) {
    console.error(`Error fetching maintenance record ${id}:`, error);
    throw error;
  }
}

// Get maintenance records for a specific car
export async function getMaintenanceRecordsByCar(carId: number) {
  try {
    const records = await db
      .select()
      .from(carMaintenance)
      .where(eq(carMaintenance.carId, carId))
      .orderBy(carMaintenance.serviceDate);
    
    return records;
  } catch (error) {
    console.error(`Error fetching maintenance records for car ${carId}:`, error);
    throw error;
  }
}

// Create a new maintenance record
export async function createMaintenanceRecord(data: typeof carMaintenance.$inferInsert) {
  try {
    const [record] = await db
      .insert(carMaintenance)
      .values(data)
      .returning();
      
    // If maintenance is a significant type that would need the car to be in maintenance,
    // update the car status
    if (
      !data.completed && 
      ["Engine Rebuild", "Transmission Repair", "Major Repairs"].includes(data.maintenanceType)
    ) {
      await db
        .update(cars)
        .set({ status: "maintenance" })
        .where(eq(cars.id, data.carId));
    }
    
    return record;
  } catch (error) {
    console.error("Error creating maintenance record:", error);
    throw error;
  }
}

// Update an existing maintenance record
export async function updateMaintenanceRecord(
  id: number,
  data: Partial<typeof carMaintenance.$inferInsert>
) {
  try {
    const [record] = await db
      .update(carMaintenance)
      .set(data)
      .where(eq(carMaintenance.id, id))
      .returning();
    
    // If maintenance was completed, update the car status back to available
    if (data.completed === true) {
      const [maintenanceRecord] = await db
        .select()
        .from(carMaintenance)
        .where(eq(carMaintenance.id, id));
      
      // Check if car is in maintenance status
      const [car] = await db
        .select()
        .from(cars)
        .where(eq(cars.id, maintenanceRecord.carId));
      
      if (car && car.status === "maintenance") {
        await db
          .update(cars)
          .set({ status: "available" })
          .where(eq(cars.id, maintenanceRecord.carId));
      }
    }
    
    return record;
  } catch (error) {
    console.error(`Error updating maintenance record ${id}:`, error);
    throw error;
  }
}

// Delete a maintenance record
export async function deleteMaintenanceRecord(id: number) {
  try {
    // Get the maintenance record first to access its car data
    const [maintenanceRecord] = await db
      .select()
      .from(carMaintenance)
      .where(eq(carMaintenance.id, id));
    
    // Delete the record
    await db
      .delete(carMaintenance)
      .where(eq(carMaintenance.id, id));
    
    // If the car is in maintenance status and this was the only ongoing maintenance,
    // update the car status back to available
    if (maintenanceRecord && !maintenanceRecord.completed) {
      // Check if there are any other ongoing maintenances for this car
      const ongoingMaintenances = await db
        .select()
        .from(carMaintenance)
        .where(
          and(
            eq(carMaintenance.carId, maintenanceRecord.carId),
            eq(carMaintenance.completed, false)
          )
        );
      
      // If no other ongoing maintenances, update car status
      if (ongoingMaintenances.length === 0) {
        // Check if car is in maintenance status
        const [car] = await db
          .select()
          .from(cars)
          .where(eq(cars.id, maintenanceRecord.carId));
        
        if (car && car.status === "maintenance") {
          await db
            .update(cars)
            .set({ status: "available" })
            .where(eq(cars.id, maintenanceRecord.carId));
        }
      }
    }
    
    return { success: true, id };
  } catch (error) {
    console.error(`Error deleting maintenance record ${id}:`, error);
    throw error;
  }
}

// Get upcoming maintenance within a certain number of days
export async function getUpcomingMaintenance(days: number = 30) {
  try {
    const today = new Date();
    const futureDate = addDays(today, days);
    
    const records = await db
      .select()
      .from(carMaintenance)
      .where(
        and(
          gte(carMaintenance.nextServiceDate, today),
          lte(carMaintenance.nextServiceDate, futureDate),
          eq(carMaintenance.completed, true) // Only include completed maintenances that have a next service date
        )
      )
      .orderBy(carMaintenance.nextServiceDate);
    
    return records;
  } catch (error) {
    console.error(`Error fetching upcoming maintenance for the next ${days} days:`, error);
    throw error;
  }
}