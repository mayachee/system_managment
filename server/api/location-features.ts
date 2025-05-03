import { Router } from "express";
import { db } from "../db";
import { locationFeatures, insertLocationFeaturesSchema } from "@shared/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { ZodError } from "zod";

const router = Router();

// Get all location features
router.get("/", async (req, res) => {
  try {
    const features = await db.query.locationFeatures.findMany({
      with: {
        location: true,
      },
    });
    res.json(features);
  } catch (error) {
    console.error("Error fetching location features:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get features for a specific location
router.get("/location/:locationId", async (req, res) => {
  const { locationId } = req.params;
  
  try {
    const [features] = await db.query.locationFeatures.findMany({
      where: eq(locationFeatures.locationId, parseInt(locationId)),
      with: {
        location: true,
      },
      limit: 1,
    });
    
    if (!features) {
      return res.status(404).json({ error: "Location features not found" });
    }
    
    res.json(features);
  } catch (error) {
    console.error(`Error fetching features for location ${locationId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create location features
router.post("/", async (req, res) => {
  try {
    const data = insertLocationFeaturesSchema.parse(req.body);
    
    // Check if features already exist for this location
    const existingFeatures = await db.query.locationFeatures.findFirst({
      where: eq(locationFeatures.locationId, data.locationId),
    });
    
    if (existingFeatures) {
      return res.status(409).json({ 
        error: "Features already exist for this location. Use PATCH to update." 
      });
    }
    
    const [features] = await db.insert(locationFeatures).values(data).returning();
    
    res.status(201).json(features);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating location features:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update location features
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const data = insertLocationFeaturesSchema.partial().parse(req.body);
    
    const [updated] = await db
      .update(locationFeatures)
      .set(data)
      .where(eq(locationFeatures.id, parseInt(id)))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Location features not found" });
    }
    
    res.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(`Error updating location features ${id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update features for a location by locationId
router.patch("/location/:locationId", async (req, res) => {
  const { locationId } = req.params;
  
  try {
    const data = insertLocationFeaturesSchema.partial().parse(req.body);
    
    const [updated] = await db
      .update(locationFeatures)
      .set(data)
      .where(eq(locationFeatures.locationId, parseInt(locationId)))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Location features not found" });
    }
    
    res.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(`Error updating features for location ${locationId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete location features
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const [deleted] = await db
      .delete(locationFeatures)
      .where(eq(locationFeatures.id, parseInt(id)))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ error: "Location features not found" });
    }
    
    res.json({ message: "Location features deleted successfully" });
  } catch (error) {
    console.error(`Error deleting location features ${id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Find locations by proximity
router.get("/nearby", async (req, res) => {
  const { lat, lng, distance } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: "Latitude and longitude are required" });
  }
  
  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);
  const maxDistance = parseInt(distance as string) || 10; // Default 10 km
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: "Invalid coordinates" });
  }
  
  try {
    // Using Haversine formula to calculate distance
    const locations = await db.execute(sql`
      SELECT lf.*, l.name, l.address,
        (
          6371 * acos(
            cos(radians(${latitude})) * cos(radians(lf.latitude)) * 
            cos(radians(lf.longitude) - radians(${longitude})) + 
            sin(radians(${latitude})) * sin(radians(lf.latitude))
          )
        ) AS distance
      FROM "${locationFeatures._.config.schema}"."${locationFeatures._.config.name}" lf
      JOIN "${locationFeatures._.config.schema}"."locations" l ON lf."location_id" = l."id"
      HAVING distance < ${maxDistance}
      ORDER BY distance
    `);
    
    res.json(locations);
  } catch (error) {
    console.error("Error finding nearby locations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Find locations with specific amenities
router.get("/filter", async (req, res) => {
  const { 
    airportShuttle,
    hours24,
    earlyReturn,
    handicapAccessible,
    amenity
  } = req.query;
  
  try {
    let query = db.query.locationFeatures.findMany({
      with: {
        location: true,
      },
    });
    
    // Build filter based on query parameters
    const filters = [];
    
    if (airportShuttle === 'true') {
      filters.push(eq(locationFeatures.hasAirportShuttle, true));
    }
    
    if (hours24 === 'true') {
      filters.push(eq(locationFeatures.has24HourPickup, true));
    }
    
    if (earlyReturn === 'true') {
      filters.push(eq(locationFeatures.hasEarlyReturn, true));
    }
    
    if (handicapAccessible === 'true') {
      filters.push(eq(locationFeatures.handicapAccessible, true));
    }
    
    if (amenity) {
      filters.push(
        sql`${locationFeatures.amenities} ? ${amenity as string}`
      );
    }
    
    // Apply filters if any exist
    if (filters.length > 0) {
      query = db.query.locationFeatures.findMany({
        where: and(...filters),
        with: {
          location: true,
        },
      });
    }
    
    const results = await query;
    
    res.json(results);
  } catch (error) {
    console.error("Error filtering locations by features:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;