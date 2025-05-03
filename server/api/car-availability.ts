import { Router } from "express";
import { db } from "../db";
import { carAvailability, rentals, insertCarAvailabilitySchema } from "@shared/schema";
import { eq, desc, and, or, gte, lte, between } from "drizzle-orm";
import { ZodError } from "zod";

const router = Router();

// Get availability for all cars in a date range
router.get("/", async (req, res) => {
  const { start, end } = req.query;
  
  if (!start || !end) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }
  
  const startDate = new Date(start as string);
  const endDate = new Date(end as string);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ error: "Invalid date format" });
  }
  
  try {
    // Get all explicit availability entries
    const availabilityEntries = await db.query.carAvailability.findMany({
      where: (availability, { and, or, lte, gte }) => {
        return or(
          // Entries that start within the range
          and(
            gte(availability.startDate, startDate),
            lte(availability.startDate, endDate)
          ),
          // Entries that end within the range
          and(
            gte(availability.endDate, startDate),
            lte(availability.endDate, endDate)
          ),
          // Entries that span the entire range
          and(
            lte(availability.startDate, startDate),
            gte(availability.endDate, endDate)
          )
        );
      },
      with: {
        car: true,
        createdByUser: true
      }
    });
    
    // Get all rentals in the date range
    const rentalEntries = await db.query.rentals.findMany({
      where: (rental, { and, or, lte, gte }) => {
        return or(
          // Rentals that start within the range
          and(
            gte(rental.startDate, startDate),
            lte(rental.startDate, endDate)
          ),
          // Rentals that end within the range
          and(
            gte(rental.endDate, startDate),
            lte(rental.endDate, endDate)
          ),
          // Rentals that span the entire range
          and(
            lte(rental.startDate, startDate),
            gte(rental.endDate, endDate)
          )
        );
      },
      with: {
        car: true,
        user: true
      }
    });
    
    // Transform rentals into availability entries
    const rentalAvailability = rentalEntries.map(rental => ({
      id: `rental-${rental.id}`,
      carId: rental.carId,
      startDate: rental.startDate,
      endDate: rental.endDate,
      status: "booked",
      reason: `Rented to ${rental.user.username}`,
      car: rental.car,
      isRental: true,
      rentalId: rental.id
    }));
    
    // Combine both sets of data
    const combinedAvailability = [
      ...availabilityEntries,
      ...rentalAvailability
    ];
    
    res.json(combinedAvailability);
  } catch (error) {
    console.error("Error fetching car availability:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get availability for a specific car
router.get("/car/:carId", async (req, res) => {
  const { carId } = req.params;
  const { start, end } = req.query;
  
  if (!start || !end) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }
  
  const startDate = new Date(start as string);
  const endDate = new Date(end as string);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ error: "Invalid date format" });
  }
  
  try {
    // Get explicit availability entries for this car
    const availabilityEntries = await db.query.carAvailability.findMany({
      where: (availability, { and, or, lte, gte, eq }) => {
        return and(
          eq(availability.carId, parseInt(carId)),
          or(
            // Entries that start within the range
            and(
              gte(availability.startDate, startDate),
              lte(availability.startDate, endDate)
            ),
            // Entries that end within the range
            and(
              gte(availability.endDate, startDate),
              lte(availability.endDate, endDate)
            ),
            // Entries that span the entire range
            and(
              lte(availability.startDate, startDate),
              gte(availability.endDate, endDate)
            )
          )
        );
      },
      with: {
        createdByUser: true
      }
    });
    
    // Get rentals for this car in the date range
    const rentalEntries = await db.query.rentals.findMany({
      where: (rental, { and, or, lte, gte, eq }) => {
        return and(
          eq(rental.carId, parseInt(carId)),
          or(
            // Rentals that start within the range
            and(
              gte(rental.startDate, startDate),
              lte(rental.startDate, endDate)
            ),
            // Rentals that end within the range
            and(
              gte(rental.endDate, startDate),
              lte(rental.endDate, endDate)
            ),
            // Rentals that span the entire range
            and(
              lte(rental.startDate, startDate),
              gte(rental.endDate, endDate)
            )
          )
        );
      },
      with: {
        user: true
      }
    });
    
    // Transform rentals into availability entries
    const rentalAvailability = rentalEntries.map(rental => ({
      id: `rental-${rental.id}`,
      carId: parseInt(carId),
      startDate: rental.startDate,
      endDate: rental.endDate,
      status: "booked",
      reason: `Rented to ${rental.user.username}`,
      isRental: true,
      rentalId: rental.id
    }));
    
    // Combine both sets of data
    const combinedAvailability = [
      ...availabilityEntries,
      ...rentalAvailability
    ];
    
    res.json(combinedAvailability);
  } catch (error) {
    console.error(`Error fetching availability for car ${carId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new availability entry
router.post("/", async (req, res) => {
  try {
    const data = insertCarAvailabilitySchema.parse(req.body);
    
    // Check for conflicts with existing availability entries
    const conflictingEntries = await db.query.carAvailability.findMany({
      where: (availability, { and, or, lte, gte, eq }) => {
        return and(
          eq(availability.carId, data.carId),
          or(
            // Existing entries that start within the new range
            and(
              gte(availability.startDate, data.startDate),
              lte(availability.startDate, data.endDate)
            ),
            // Existing entries that end within the new range
            and(
              gte(availability.endDate, data.startDate),
              lte(availability.endDate, data.endDate)
            ),
            // Existing entries that span the entire new range
            and(
              lte(availability.startDate, data.startDate),
              gte(availability.endDate, data.endDate)
            )
          )
        );
      }
    });
    
    if (conflictingEntries.length > 0) {
      return res.status(409).json({ 
        error: "This availability conflicts with existing entries", 
        conflicts: conflictingEntries 
      });
    }
    
    // Check for conflicts with existing rentals
    const conflictingRentals = await db.query.rentals.findMany({
      where: (rental, { and, or, lte, gte, eq }) => {
        return and(
          eq(rental.carId, data.carId),
          or(
            // Rentals that start within the new range
            and(
              gte(rental.startDate, data.startDate),
              lte(rental.startDate, data.endDate)
            ),
            // Rentals that end within the new range
            and(
              gte(rental.endDate, data.startDate),
              lte(rental.endDate, data.endDate)
            ),
            // Rentals that span the entire new range
            and(
              lte(rental.startDate, data.startDate),
              gte(rental.endDate, data.endDate)
            )
          )
        );
      }
    });
    
    if (conflictingRentals.length > 0) {
      return res.status(409).json({ 
        error: "This availability conflicts with existing rentals", 
        conflicts: conflictingRentals 
      });
    }
    
    const [entry] = await db.insert(carAvailability).values(data).returning();
    
    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating availability entry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update an availability entry
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const data = insertCarAvailabilitySchema.partial().parse(req.body);
    
    // Check if entry exists
    const [existingEntry] = await db
      .select()
      .from(carAvailability)
      .where(eq(carAvailability.id, parseInt(id)))
      .limit(1);
    
    if (!existingEntry) {
      return res.status(404).json({ error: "Availability entry not found" });
    }
    
    // If dates are changing, check for conflicts
    if (data.startDate || data.endDate) {
      const startDate = data.startDate || existingEntry.startDate;
      const endDate = data.endDate || existingEntry.endDate;
      
      // Check for conflicts with other availability entries
      const conflictingEntries = await db.query.carAvailability.findMany({
        where: (availability, { and, or, lte, gte, eq, ne }) => {
          return and(
            eq(availability.carId, existingEntry.carId),
            ne(availability.id, parseInt(id)), // Exclude this entry
            or(
              and(
                gte(availability.startDate, startDate),
                lte(availability.startDate, endDate)
              ),
              and(
                gte(availability.endDate, startDate),
                lte(availability.endDate, endDate)
              ),
              and(
                lte(availability.startDate, startDate),
                gte(availability.endDate, endDate)
              )
            )
          );
        }
      });
      
      if (conflictingEntries.length > 0) {
        return res.status(409).json({ 
          error: "This update conflicts with existing entries", 
          conflicts: conflictingEntries 
        });
      }
      
      // Check for conflicts with rentals
      const conflictingRentals = await db.query.rentals.findMany({
        where: (rental, { and, or, lte, gte, eq }) => {
          return and(
            eq(rental.carId, existingEntry.carId),
            or(
              and(
                gte(rental.startDate, startDate),
                lte(rental.startDate, endDate)
              ),
              and(
                gte(rental.endDate, startDate),
                lte(rental.endDate, endDate)
              ),
              and(
                lte(rental.startDate, startDate),
                gte(rental.endDate, endDate)
              )
            )
          );
        }
      });
      
      if (conflictingRentals.length > 0) {
        return res.status(409).json({ 
          error: "This update conflicts with existing rentals", 
          conflicts: conflictingRentals 
        });
      }
    }
    
    const [updated] = await db
      .update(carAvailability)
      .set(data)
      .where(eq(carAvailability.id, parseInt(id)))
      .returning();
    
    res.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(`Error updating availability entry ${id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete an availability entry
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const [deleted] = await db
      .delete(carAvailability)
      .where(eq(carAvailability.id, parseInt(id)))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ error: "Availability entry not found" });
    }
    
    res.json({ message: "Availability entry deleted successfully" });
  } catch (error) {
    console.error(`Error deleting availability entry ${id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check if a car is available for a specific date range
router.get("/check/:carId", async (req, res) => {
  const { carId } = req.params;
  const { start, end } = req.query;
  
  if (!start || !end) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }
  
  const startDate = new Date(start as string);
  const endDate = new Date(end as string);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ error: "Invalid date format" });
  }
  
  try {
    // Check for availability entries that would block this period
    const blockingAvailability = await db.query.carAvailability.findMany({
      where: (availability, { and, or, lte, gte, eq, ne }) => {
        return and(
          eq(availability.carId, parseInt(carId)),
          ne(availability.status, "available"), // Only non-available entries
          or(
            // Entries that start within the range
            and(
              gte(availability.startDate, startDate),
              lte(availability.startDate, endDate)
            ),
            // Entries that end within the range
            and(
              gte(availability.endDate, startDate),
              lte(availability.endDate, endDate)
            ),
            // Entries that span the entire range
            and(
              lte(availability.startDate, startDate),
              gte(availability.endDate, endDate)
            )
          )
        );
      }
    });
    
    // Check for rentals that would block this period
    const blockingRentals = await db.query.rentals.findMany({
      where: (rental, { and, or, lte, gte, eq, ne }) => {
        return and(
          eq(rental.carId, parseInt(carId)),
          ne(rental.status, "cancelled"), // Exclude cancelled rentals
          or(
            // Rentals that start within the range
            and(
              gte(rental.startDate, startDate),
              lte(rental.startDate, endDate)
            ),
            // Rentals that end within the range
            and(
              gte(rental.endDate, startDate),
              lte(rental.endDate, endDate)
            ),
            // Rentals that span the entire range
            and(
              lte(rental.startDate, startDate),
              gte(rental.endDate, endDate)
            )
          )
        );
      }
    });
    
    const isAvailable = blockingAvailability.length === 0 && blockingRentals.length === 0;
    
    res.json({
      carId: parseInt(carId),
      startDate,
      endDate,
      isAvailable,
      conflicts: {
        availability: blockingAvailability,
        rentals: blockingRentals
      }
    });
  } catch (error) {
    console.error(`Error checking availability for car ${carId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;