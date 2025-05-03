import { Request, Response } from "express";
import { db } from "../db";
import { sql, eq, and, count, sum, desc, asc } from "drizzle-orm";
import {
  loyaltyProgram,
  loyaltyPoints,
  pointsTransactions,
  users
} from "@shared/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Zod schemas for validation
const insertLoyaltyProgramSchema = createInsertSchema(loyaltyProgram);
const insertLoyaltyPointsSchema = createInsertSchema(loyaltyPoints);
const insertPointsTransactionSchema = createInsertSchema(pointsTransactions);

// Define the allowed filters for transaction types
const validTransactionTypes = ["earn", "redeem", "expire", "bonus"] as const;

/**
 * Get all loyalty programs
 */
export async function getAllPrograms(req: Request, res: Response) {
  try {
    const programs = await db.select().from(loyaltyProgram);
    res.json(programs);
  } catch (error) {
    console.error("Error fetching loyalty programs:", error);
    res.status(500).json({ error: "Failed to fetch loyalty programs" });
  }
}

/**
 * Get a specific loyalty program by ID
 */
export async function getProgramById(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    const [program] = await db
      .select()
      .from(loyaltyProgram)
      .where(eq(loyaltyProgram.id, parseInt(id)));
    
    if (!program) {
      return res.status(404).json({ error: "Loyalty program not found" });
    }
    
    res.json(program);
  } catch (error) {
    console.error(`Error fetching loyalty program with ID ${id}:`, error);
    res.status(500).json({ error: "Failed to fetch loyalty program" });
  }
}

/**
 * Create a new loyalty program
 */
export async function createProgram(req: Request, res: Response) {
  try {
    const validatedData = insertLoyaltyProgramSchema.parse(req.body);
    
    const [program] = await db
      .insert(loyaltyProgram)
      .values({
        ...validatedData,
        createdAt: new Date(),
      })
      .returning();
    
    res.status(201).json(program);
  } catch (error) {
    console.error("Error creating loyalty program:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    res.status(500).json({ error: "Failed to create loyalty program" });
  }
}

/**
 * Update a loyalty program
 */
export async function updateProgram(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    // First check if the program exists
    const [existingProgram] = await db
      .select()
      .from(loyaltyProgram)
      .where(eq(loyaltyProgram.id, parseInt(id)));
    
    if (!existingProgram) {
      return res.status(404).json({ error: "Loyalty program not found" });
    }
    
    const validatedData = insertLoyaltyProgramSchema.partial().parse(req.body);
    
    const [updatedProgram] = await db
      .update(loyaltyProgram)
      .set(validatedData)
      .where(eq(loyaltyProgram.id, parseInt(id)))
      .returning();
    
    res.json(updatedProgram);
  } catch (error) {
    console.error(`Error updating loyalty program with ID ${id}:`, error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    res.status(500).json({ error: "Failed to update loyalty program" });
  }
}

/**
 * Delete a loyalty program (soft delete by setting active=false)
 */
export async function deleteProgram(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    // First check if the program exists
    const [existingProgram] = await db
      .select()
      .from(loyaltyProgram)
      .where(eq(loyaltyProgram.id, parseInt(id)));
    
    if (!existingProgram) {
      return res.status(404).json({ error: "Loyalty program not found" });
    }
    
    // Soft delete by setting active=false
    const [deactivatedProgram] = await db
      .update(loyaltyProgram)
      .set({ active: false })
      .where(eq(loyaltyProgram.id, parseInt(id)))
      .returning();
    
    res.json(deactivatedProgram);
  } catch (error) {
    console.error(`Error deleting loyalty program with ID ${id}:`, error);
    res.status(500).json({ error: "Failed to delete loyalty program" });
  }
}

/**
 * Get all loyalty points records for a user
 */
export async function getUserLoyaltyPoints(req: Request, res: Response) {
  const { userId } = req.params;
  
  // Check if the user exists and if the requesting user has permission
  if (req.user?.role !== "admin" && req.user?.id !== parseInt(userId)) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    const result = await db
      .select({
        loyaltyPoints: loyaltyPoints,
        program: loyaltyProgram
      })
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.userId, parseInt(userId)))
      .leftJoin(loyaltyProgram, eq(loyaltyPoints.programId, loyaltyProgram.id));
    
    // Format the response
    const formattedResult = result.map(item => ({
      ...item.loyaltyPoints,
      program: {
        id: item.program.id,
        name: item.program.name,
        description: item.program.description,
        pointsPerDollar: item.program.pointsPerDollar,
        active: item.program.active,
        tiers: item.program.tiers,
      }
    }));
    
    res.json(formattedResult);
  } catch (error) {
    console.error(`Error fetching loyalty points for user ${userId}:`, error);
    res.status(500).json({ error: "Failed to fetch loyalty points" });
  }
}

/**
 * Get all transactions for a user
 */
export async function getUserTransactions(req: Request, res: Response) {
  const { userId } = req.params;
  const { type, limit = 50, offset = 0 } = req.query;
  
  // Check if the user exists and if the requesting user has permission
  if (req.user?.role !== "admin" && req.user?.id !== parseInt(userId)) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    let query = db
      .select({
        transaction: pointsTransactions,
        loyaltyPoints: loyaltyPoints,
        program: {
          name: loyaltyProgram.name,
        }
      })
      .from(pointsTransactions)
      .innerJoin(loyaltyPoints, eq(pointsTransactions.loyaltyPointsId, loyaltyPoints.id))
      .innerJoin(loyaltyProgram, eq(loyaltyPoints.programId, loyaltyProgram.id))
      .where(eq(loyaltyPoints.userId, parseInt(userId)))
      .orderBy(desc(pointsTransactions.transactionDate));
    
    // Filter by transaction type if specified
    if (type && validTransactionTypes.includes(type as any)) {
      query = query.where(eq(pointsTransactions.transactionType, type as any));
    }
    
    // Add pagination
    const limitValue = Math.min(parseInt(limit as string), 100); // Max 100 records per request
    query = query.limit(limitValue).offset(parseInt(offset as string));
    
    const transactions = await query;
    
    res.json(transactions);
  } catch (error) {
    console.error(`Error fetching transactions for user ${userId}:`, error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
}

/**
 * Enroll a user in a loyalty program
 */
export async function enrollUserInProgram(req: Request, res: Response) {
  const { userId } = req.params;
  const { programId } = req.body;
  
  // Check if the user exists and if the requesting user has permission
  if (req.user?.role !== "admin" && req.user?.id !== parseInt(userId)) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    // Check if the program exists
    const [program] = await db
      .select()
      .from(loyaltyProgram)
      .where(eq(loyaltyProgram.id, programId));
    
    if (!program) {
      return res.status(404).json({ error: "Loyalty program not found" });
    }
    
    // Check if the user is already enrolled
    const [existingEnrollment] = await db
      .select()
      .from(loyaltyPoints)
      .where(
        and(
          eq(loyaltyPoints.userId, parseInt(userId)),
          eq(loyaltyPoints.programId, programId)
        )
      );
    
    if (existingEnrollment) {
      return res.status(400).json({ error: "User is already enrolled in this program" });
    }
    
    // Determine the initial tier (always the lowest tier)
    const lowestTier = program.tiers.reduce((lowest, current) => {
      if (current.minimumPoints < lowest.minimumPoints) {
        return current;
      }
      return lowest;
    }, program.tiers[0]);
    
    // Create the enrollment - join_date column has been added to the database
    const [enrollment] = await db
      .insert(loyaltyPoints)
      .values({
        userId: parseInt(userId),
        programId,
        points: 0,
        tier: lowestTier.name,
        joinDate: new Date(),
        lastActivity: null,
        expiryDate: null,
      })
      .returning();
    
    res.status(201).json(enrollment);
  } catch (error) {
    console.error(`Error enrolling user ${userId} in program:`, error);
    res.status(500).json({ error: "Failed to enroll in program" });
  }
}

/**
 * Create a new transaction (earn or redeem points)
 */
export async function createTransaction(req: Request, res: Response) {
  try {
    const data = insertPointsTransactionSchema.parse(req.body);
    
    // Get the loyalty points record
    const [loyaltyPointsRecord] = await db
      .select()
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.id, data.loyaltyPointsId));
    
    if (!loyaltyPointsRecord) {
      return res.status(404).json({ error: "Loyalty points record not found" });
    }
    
    // Check if the user has permission
    if (req.user?.role !== "admin" && req.user?.id !== loyaltyPointsRecord.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // Calculate the new points balance
    let newPoints = loyaltyPointsRecord.points;
    
    if (data.transactionType === "earn" || data.transactionType === "bonus") {
      newPoints += data.points;
    } else if (data.transactionType === "redeem" || data.transactionType === "expire") {
      // Check if the user has enough points
      if (loyaltyPointsRecord.points < data.points) {
        return res.status(400).json({ error: "Insufficient points for this transaction" });
      }
      newPoints -= data.points;
    }
    
    // Get the program to check the tiers
    const [program] = await db
      .select()
      .from(loyaltyProgram)
      .where(eq(loyaltyProgram.id, loyaltyPointsRecord.programId));
    
    if (!program) {
      return res.status(404).json({ error: "Loyalty program not found" });
    }
    
    // Determine if the tier needs to be updated
    let newTier = loyaltyPointsRecord.tier;
    
    // Sort tiers by minimumPoints in ascending order
    const sortedTiers = [...program.tiers].sort((a, b) => a.minimumPoints - b.minimumPoints);
    
    // Find the highest tier that the user qualifies for
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (newPoints >= sortedTiers[i].minimumPoints) {
        newTier = sortedTiers[i].name;
        break;
      }
    }
    
    // Transaction will be created in a transaction to ensure consistency
    const [transaction] = await db.transaction(async (tx) => {
      // Create the transaction
      const [newTransaction] = await tx
        .insert(pointsTransactions)
        .values(data)
        .returning();
      
      // Update the loyalty points record
      await tx
        .update(loyaltyPoints)
        .set({
          points: newPoints,
          tier: newTier,
          lastActivity: new Date(),
        })
        .where(eq(loyaltyPoints.id, data.loyaltyPointsId));
      
      return [newTransaction];
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    res.status(500).json({ error: "Failed to create transaction" });
  }
}

/**
 * Get all users enrolled in a program (admin only)
 */
export async function getProgramUsers(req: Request, res: Response) {
  const { programId } = req.params;
  
  // This is an admin-only endpoint
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    const result = await db
      .select({
        loyaltyPoints: loyaltyPoints,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
        }
      })
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.programId, parseInt(programId)))
      .innerJoin(users, eq(loyaltyPoints.userId, users.id))
      .orderBy(desc(loyaltyPoints.points));
    
    res.json(result);
  } catch (error) {
    console.error(`Error fetching users enrolled in program ${programId}:`, error);
    res.status(500).json({ error: "Failed to fetch enrolled users" });
  }
}

/**
 * Get program statistics (admin only)
 */
export async function getProgramStatistics(req: Request, res: Response) {
  const { programId } = req.params;
  
  // This is an admin-only endpoint
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    // Get the program first
    const [program] = await db
      .select()
      .from(loyaltyProgram)
      .where(eq(loyaltyProgram.id, parseInt(programId)));
    
    if (!program) {
      return res.status(404).json({ error: "Loyalty program not found" });
    }
    
    // Count the number of members
    const [memberCount] = await db
      .select({ count: count() })
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.programId, parseInt(programId)));
    
    // Get points issued (sum of earn and bonus transactions)
    const [pointsIssued] = await db
      .select({ sum: sum(pointsTransactions.points) })
      .from(pointsTransactions)
      .innerJoin(loyaltyPoints, eq(pointsTransactions.loyaltyPointsId, loyaltyPoints.id))
      .where(
        and(
          eq(loyaltyPoints.programId, parseInt(programId)),
          sql`${pointsTransactions.transactionType} IN ('earn', 'bonus')`
        )
      );
    
    // Get points redeemed (sum of redeem transactions)
    const [pointsRedeemed] = await db
      .select({ sum: sum(pointsTransactions.points) })
      .from(pointsTransactions)
      .innerJoin(loyaltyPoints, eq(pointsTransactions.loyaltyPointsId, loyaltyPoints.id))
      .where(
        and(
          eq(loyaltyPoints.programId, parseInt(programId)),
          eq(pointsTransactions.transactionType, "redeem")
        )
      );
    
    // Get total active points (total points across all members)
    const [activePoints] = await db
      .select({ sum: sum(loyaltyPoints.points) })
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.programId, parseInt(programId)));
    
    // Get the distribution of members by tier
    const tierCounts = await db
      .select({
        tier: loyaltyPoints.tier,
        count: count(),
      })
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.programId, parseInt(programId)))
      .groupBy(loyaltyPoints.tier);
    
    // Calculate redemption rate
    const totalIssued = pointsIssued?.sum || 0;
    const totalRedeemed = pointsRedeemed?.sum || 0;
    const redemptionRate = totalIssued > 0 ? (totalRedeemed / totalIssued) * 100 : 0;
    
    const statistics = {
      programId: parseInt(programId),
      programName: program.name,
      memberCount: memberCount?.count || 0,
      totalPointsIssued: totalIssued,
      totalPointsRedeemed: totalRedeemed,
      totalActivePoints: activePoints?.sum || 0,
      redemptionRate: parseFloat(redemptionRate.toFixed(2)),
      membershipByTier: tierCounts,
    };
    
    res.json(statistics);
  } catch (error) {
    console.error(`Error fetching statistics for program ${programId}:`, error);
    res.status(500).json({ error: "Failed to fetch program statistics" });
  }
}

/**
 * Check if a user can redeem points
 */
export async function checkRedemptionEligibility(req: Request, res: Response) {
  const { userId, points } = req.params;
  const { programId } = req.query;
  
  // Check if the user exists and if the requesting user has permission
  if (req.user?.role !== "admin" && req.user?.id !== parseInt(userId)) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    // Get the user's loyalty points for the specified program
    const [loyaltyPointsRecord] = await db
      .select()
      .from(loyaltyPoints)
      .where(
        and(
          eq(loyaltyPoints.userId, parseInt(userId)),
          eq(loyaltyPoints.programId, parseInt(programId as string))
        )
      );
    
    if (!loyaltyPointsRecord) {
      return res.json({
        canRedeem: false,
        reason: "User is not enrolled in this program",
        availablePoints: 0
      });
    }
    
    // Check if the user has enough points
    const pointsToRedeem = parseInt(points);
    const availablePoints = loyaltyPointsRecord.points;
    
    if (availablePoints < pointsToRedeem) {
      return res.json({
        canRedeem: false,
        reason: "Insufficient points",
        availablePoints
      });
    }
    
    // Check if there's a redemption rule for this number of points
    const [program] = await db
      .select()
      .from(loyaltyProgram)
      .where(eq(loyaltyProgram.id, parseInt(programId as string)));
    
    if (!program) {
      return res.status(404).json({ error: "Loyalty program not found" });
    }
    
    const redemptionRule = program.redemptionRules.find(
      rule => rule.pointsRequired === pointsToRedeem
    );
    
    if (!redemptionRule) {
      return res.json({
        canRedeem: false,
        reason: "No redemption rule found for this number of points",
        availablePoints
      });
    }
    
    // User can redeem points
    return res.json({
      canRedeem: true,
      availablePoints,
      reward: redemptionRule.rewardDescription,
      value: redemptionRule.value
    });
  } catch (error) {
    console.error(`Error checking redemption eligibility for user ${userId}:`, error);
    res.status(500).json({ error: "Failed to check redemption eligibility" });
  }
}