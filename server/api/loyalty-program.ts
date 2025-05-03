import { Router } from "express";
import { db } from "../db";
import { 
  loyaltyProgram, 
  loyaltyPoints, 
  pointsTransactions, 
  insertLoyaltyProgramSchema,
  insertLoyaltyPointsSchema,
  insertPointsTransactionSchema
} from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { ZodError } from "zod";

const router = Router();

// Get all loyalty programs
router.get("/programs", async (req, res) => {
  const { active } = req.query;
  
  try {
    let query = db.select().from(loyaltyProgram);
    
    if (active === 'true') {
      query = query.where(eq(loyaltyProgram.active, true));
    }
    
    const results = await query.orderBy(desc(loyaltyProgram.createdAt));
    
    res.json(results);
  } catch (error) {
    console.error("Error fetching loyalty programs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a specific loyalty program
router.get("/programs/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const [program] = await db
      .select()
      .from(loyaltyProgram)
      .where(eq(loyaltyProgram.id, parseInt(id)))
      .limit(1);
    
    if (!program) {
      return res.status(404).json({ error: "Loyalty program not found" });
    }
    
    res.json(program);
  } catch (error) {
    console.error(`Error fetching loyalty program ${id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new loyalty program
router.post("/programs", async (req, res) => {
  try {
    // Only admins can create loyalty programs
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: "Only administrators can create loyalty programs" 
      });
    }
    
    const data = insertLoyaltyProgramSchema.parse(req.body);
    
    const [program] = await db.insert(loyaltyProgram).values(data).returning();
    
    res.status(201).json(program);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating loyalty program:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a loyalty program
router.patch("/programs/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    // Only admins can update loyalty programs
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: "Only administrators can update loyalty programs" 
      });
    }
    
    const data = insertLoyaltyProgramSchema.partial().parse(req.body);
    
    const [updated] = await db
      .update(loyaltyProgram)
      .set(data)
      .where(eq(loyaltyProgram.id, parseInt(id)))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Loyalty program not found" });
    }
    
    res.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(`Error updating loyalty program ${id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user loyalty details
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  
  try {
    const userLoyaltyPoints = await db.query.loyaltyPoints.findMany({
      where: eq(loyaltyPoints.userId, parseInt(userId)),
      with: {
        program: true,
      },
    });
    
    res.json(userLoyaltyPoints);
  } catch (error) {
    console.error(`Error fetching loyalty points for user ${userId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Enroll a user in a loyalty program
router.post("/enroll", async (req, res) => {
  try {
    const { userId, programId } = req.body;
    
    // Check if user is already enrolled
    const existingEnrollment = await db.query.loyaltyPoints.findFirst({
      where: and(
        eq(loyaltyPoints.userId, userId),
        eq(loyaltyPoints.programId, programId)
      ),
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ 
        error: "User is already enrolled in this loyalty program" 
      });
    }
    
    // Get program details to set default tier
    const [program] = await db
      .select()
      .from(loyaltyProgram)
      .where(eq(loyaltyProgram.id, programId))
      .limit(1);
    
    if (!program) {
      return res.status(404).json({ error: "Loyalty program not found" });
    }
    
    // Create enrollment
    const enrollmentData: any = {
      userId,
      programId,
      points: 0,
      tier: program.tiers[0]?.name || "Bronze", // Default to first tier or Bronze
      joinDate: new Date(),
    };
    
    const [enrollment] = await db
      .insert(loyaltyPoints)
      .values(enrollmentData)
      .returning();
    
    res.status(201).json(enrollment);
  } catch (error) {
    console.error("Error enrolling user in loyalty program:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add transaction (earn/redeem points)
router.post("/transactions", async (req, res) => {
  try {
    const data = insertPointsTransactionSchema.parse(req.body);
    
    // Get user's loyalty points record
    const [userPoints] = await db
      .select()
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.id, data.loyaltyPointsId))
      .limit(1);
    
    if (!userPoints) {
      return res.status(404).json({ error: "User loyalty points record not found" });
    }
    
    // Get program details for tier calculation
    const [program] = await db
      .select()
      .from(loyaltyProgram)
      .where(eq(loyaltyProgram.id, userPoints.programId))
      .limit(1);
    
    // Calculate new points balance
    let newPoints = userPoints.points;
    
    if (data.transactionType === "earn") {
      newPoints += data.points;
    } else if (data.transactionType === "redeem") {
      // Check if user has enough points
      if (userPoints.points < data.points) {
        return res.status(400).json({ error: "Insufficient points for redemption" });
      }
      newPoints -= data.points;
    } else if (data.transactionType === "expire") {
      newPoints -= data.points;
      if (newPoints < 0) newPoints = 0;
    } else if (data.transactionType === "bonus") {
      newPoints += data.points;
    }
    
    // Determine tier based on new points total (if program exists)
    let newTier = userPoints.tier;
    if (program) {
      for (let i = program.tiers.length - 1; i >= 0; i--) {
        if (newPoints >= program.tiers[i].pointsRequired) {
          newTier = program.tiers[i].name;
          break;
        }
      }
    }
    
    // Create transaction record
    const [transaction] = await db
      .insert(pointsTransactions)
      .values(data)
      .returning();
    
    // Update user loyalty points
    const [updatedPoints] = await db
      .update(loyaltyPoints)
      .set({
        points: newPoints,
        tier: newTier,
        lastActivity: new Date()
      })
      .where(eq(loyaltyPoints.id, data.loyaltyPointsId))
      .returning();
    
    res.status(201).json({
      transaction,
      loyaltyPoints: updatedPoints
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating points transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get transaction history for a user
router.get("/transactions/user/:userId", async (req, res) => {
  const { userId } = req.params;
  
  try {
    // First get all loyalty points records for this user
    const userPointsRecords = await db.query.loyaltyPoints.findMany({
      where: eq(loyaltyPoints.userId, parseInt(userId)),
    });
    
    if (userPointsRecords.length === 0) {
      return res.json([]);
    }
    
    // Get all transactions for these loyalty points records
    const loyaltyPointsIds = userPointsRecords.map(record => record.id);
    
    const transactions = await db.query.pointsTransactions.findMany({
      where: (pt, { inArray }) => inArray(pt.loyaltyPointsId, loyaltyPointsIds),
      orderBy: [desc(pointsTransactions.transactionDate)],
    });
    
    res.json(transactions);
  } catch (error) {
    console.error(`Error fetching transactions for user ${userId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get expiring points
router.get("/expiring/:days", async (req, res) => {
  const { days } = req.params;
  const daysAhead = parseInt(days) || 30;
  
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    const expiringPoints = await db.query.loyaltyPoints.findMany({
      where: (lp, { and, gte, lte, not, isNull }) => {
        return and(
          not(isNull(lp.expiryDate)),
          gte(lp.expiryDate, today),
          lte(lp.expiryDate, futureDate),
          gte(lp.points, 1)
        );
      },
      with: {
        user: true,
        program: true,
      },
      orderBy: [loyaltyPoints.expiryDate],
    });
    
    res.json(expiringPoints);
  } catch (error) {
    console.error(`Error fetching expiring points:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;