import { Router } from "express";
import { db } from "../db";
import { damageReports, insertDamageReportSchema } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { ZodError } from "zod";

const router = Router();

// Get all damage reports
router.get("/", async (req, res) => {
  const { status, reportType } = req.query;
  
  try {
    let query = db.select().from(damageReports);
    
    if (status) {
      query = query.where(eq(damageReports.status, status as string));
    }
    
    if (reportType) {
      query = query.where(eq(damageReports.reportType, reportType as string));
    }
    
    const results = await query.orderBy(desc(damageReports.reportDate));
    
    res.json(results);
  } catch (error) {
    console.error("Error fetching damage reports:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a specific damage report
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const [report] = await db.query.damageReports.findMany({
      where: eq(damageReports.id, parseInt(id)),
      with: {
        rental: {
          with: {
            car: true,
            user: true
          }
        },
        inspector: true
      },
      limit: 1,
    });
    
    if (!report) {
      return res.status(404).json({ error: "Damage report not found" });
    }
    
    res.json(report);
  } catch (error) {
    console.error(`Error fetching damage report ${id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get damage reports for a rental
router.get("/rental/:rentalId", async (req, res) => {
  const { rentalId } = req.params;
  
  try {
    const results = await db.query.damageReports.findMany({
      where: eq(damageReports.rentalId, parseInt(rentalId)),
      with: {
        inspector: true
      },
      orderBy: [desc(damageReports.reportDate)],
    });
    
    res.json(results);
  } catch (error) {
    console.error(`Error fetching damage reports for rental ${rentalId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new damage report
router.post("/", async (req, res) => {
  try {
    const data = insertDamageReportSchema.parse(req.body);
    
    // Optional: Check if a report of this type already exists for this rental
    if (data.reportType) {
      const existingReport = await db.query.damageReports.findFirst({
        where: and(
          eq(damageReports.rentalId, data.rentalId),
          eq(damageReports.reportType, data.reportType)
        ),
      });
      
      if (existingReport) {
        return res.status(400).json({ 
          error: `A ${data.reportType} report already exists for this rental` 
        });
      }
    }
    
    const [report] = await db.insert(damageReports).values(data).returning();
    
    res.status(201).json(report);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating damage report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a damage report
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const data = insertDamageReportSchema.partial().parse(req.body);
    
    // Optional: Check permissions (only admin or the inspector can update)
    if (req.user && req.user.role !== 'admin') {
      const [report] = await db
        .select()
        .from(damageReports)
        .where(eq(damageReports.id, parseInt(id)));
      
      if (!report || report.inspectorId !== req.user.id) {
        return res.status(403).json({ 
          error: "You don't have permission to update this damage report" 
        });
      }
    }
    
    const [updated] = await db
      .update(damageReports)
      .set(data)
      .where(eq(damageReports.id, parseInt(id)))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Damage report not found" });
    }
    
    res.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(`Error updating damage report ${id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a damage report
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    // Only admins should be able to delete damage reports
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: "Only administrators can delete damage reports" 
      });
    }
    
    const [deleted] = await db
      .delete(damageReports)
      .where(eq(damageReports.id, parseInt(id)))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ error: "Damage report not found" });
    }
    
    res.json({ message: "Damage report deleted successfully" });
  } catch (error) {
    console.error(`Error deleting damage report ${id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get summary of damage costs
router.get("/summary/costs", async (req, res) => {
  try {
    const results = await db
      .select({
        estimatedTotal: db.fn.sum(damageReports.estimatedRepairCost).as("estimatedTotal"),
        actualTotal: db.fn.sum(damageReports.actualRepairCost).as("actualTotal"),
        count: db.fn.count(damageReports.id).as("count")
      })
      .from(damageReports);
    
    if (results.length === 0) {
      return res.json({ 
        estimatedTotal: 0, 
        actualTotal: 0, 
        count: 0 
      });
    }
    
    res.json({
      estimatedTotal: parseFloat(results[0].estimatedTotal?.toString() || "0"),
      actualTotal: parseFloat(results[0].actualTotal?.toString() || "0"),
      count: parseInt(results[0].count.toString())
    });
  } catch (error) {
    console.error("Error fetching damage cost summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;