import { Router } from "express";
import { db } from "../db";
import { reviews, insertReviewSchema } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { ZodError } from "zod";

const router = Router();

// Get all reviews (with filters for public/verified/etc.)
router.get("/", async (req, res) => {
  const { public: isPublic, verified, carId, userId } = req.query;
  
  try {
    let query = db.select().from(reviews);
    
    if (isPublic === 'true') {
      query = query.where(eq(reviews.isPublic, true));
    }
    
    if (verified === 'true') {
      query = query.where(eq(reviews.verified, true));
    }
    
    if (carId) {
      query = query.where(eq(reviews.carId, parseInt(carId as string)));
    }
    
    if (userId) {
      query = query.where(eq(reviews.userId, parseInt(userId as string)));
    }
    
    const results = await query.orderBy(desc(reviews.reviewDate));
    
    res.json(results);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a specific review
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const [review] = await db.query.reviews.findMany({
      where: eq(reviews.id, parseInt(id)),
      with: {
        user: true,
        car: true,
        rental: true,
      },
      limit: 1,
    });
    
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    res.json(review);
  } catch (error) {
    console.error(`Error fetching review ${id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get reviews for a specific car
router.get("/car/:carId", async (req, res) => {
  const { carId } = req.params;
  const { public: isPublic } = req.query;
  
  try {
    let query = db.query.reviews.findMany({
      where: (review, { and, eq }) => {
        const conditions = [eq(review.carId, parseInt(carId))];
        
        if (isPublic === 'true') {
          conditions.push(eq(review.isPublic, true));
        }
        
        return and(...conditions);
      },
      with: {
        user: true,
      },
      orderBy: [desc(reviews.reviewDate)],
    });
    
    const results = await query;
    
    res.json(results);
  } catch (error) {
    console.error(`Error fetching reviews for car ${carId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get reviews by a specific user
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  
  try {
    const results = await db.query.reviews.findMany({
      where: eq(reviews.userId, parseInt(userId)),
      with: {
        car: true,
        rental: true,
      },
      orderBy: [desc(reviews.reviewDate)],
    });
    
    res.json(results);
  } catch (error) {
    console.error(`Error fetching reviews for user ${userId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new review
router.post("/", async (req, res) => {
  try {
    const data = insertReviewSchema.parse(req.body);
    
    // Check if user has already reviewed this rental
    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.userId, data.userId),
        eq(reviews.rentalId, data.rentalId)
      ),
    });
    
    if (existingReview) {
      return res.status(400).json({ 
        error: "You have already submitted a review for this rental" 
      });
    }
    
    const [review] = await db.insert(reviews).values(data).returning();
    
    res.status(201).json(review);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a review
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const data = insertReviewSchema.partial().parse(req.body);
    
    // Check if the user is the author of the review
    if (req.user && req.user.role !== 'admin') {
      const [review] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.id, parseInt(id)));
      
      if (!review || review.userId !== req.user.id) {
        return res.status(403).json({ 
          error: "You don't have permission to update this review" 
        });
      }
    }
    
    const [updated] = await db
      .update(reviews)
      .set(data)
      .where(eq(reviews.id, parseInt(id)))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    res.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(`Error updating review ${id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a review
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if the user is the author of the review or an admin
    if (req.user && req.user.role !== 'admin') {
      const [review] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.id, parseInt(id)));
      
      if (!review || review.userId !== req.user.id) {
        return res.status(403).json({ 
          error: "You don't have permission to delete this review" 
        });
      }
    }
    
    const [deleted] = await db
      .delete(reviews)
      .where(eq(reviews.id, parseInt(id)))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error(`Error deleting review ${id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get average rating for a car
router.get("/car/:carId/rating", async (req, res) => {
  const { carId } = req.params;
  
  try {
    const results = await db
      .select({
        avgRating: db.fn.avg(reviews.rating).as("avgRating"),
        count: db.fn.count(reviews.id).as("count")
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.carId, parseInt(carId)),
          eq(reviews.isPublic, true)
        )
      );
    
    if (results.length === 0 || !results[0].avgRating) {
      return res.json({ avgRating: 0, count: 0 });
    }
    
    res.json({
      avgRating: parseFloat(results[0].avgRating.toString()),
      count: parseInt(results[0].count.toString())
    });
  } catch (error) {
    console.error(`Error fetching average rating for car ${carId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;