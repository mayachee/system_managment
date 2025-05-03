import { db } from "../db";
import { eq, desc, and, or, gt } from "drizzle-orm";
import { 
  vehicleHealthComponents, 
  vehicleHealthDashboard, 
  insertVehicleHealthComponentSchema,
  insertVehicleHealthDashboardSchema,
  HealthConditionStatus,
  cars
} from "@shared/schema";
import { z } from "zod";

// Get all health components for a specific car
export async function getCarHealthComponents(carId: number) {
  try {
    const components = await db.query.vehicleHealthComponents.findMany({
      where: eq(vehicleHealthComponents.carId, carId),
      orderBy: [desc(vehicleHealthComponents.lastChecked)],
      with: {
        car: true,
        updatedByUser: true
      }
    });
    return components;
  } catch (error) {
    console.error("Error fetching car health components:", error);
    throw new Error("Failed to fetch car health components");
  }
}

// Get a specific health component by ID
export async function getHealthComponentById(id: number) {
  try {
    const component = await db.query.vehicleHealthComponents.findFirst({
      where: eq(vehicleHealthComponents.id, id),
      with: {
        car: true,
        updatedByUser: true
      }
    });
    return component;
  } catch (error) {
    console.error("Error fetching health component:", error);
    throw new Error("Failed to fetch health component");
  }
}

// Create a new health component
export async function createHealthComponent(data: z.infer<typeof insertVehicleHealthComponentSchema>) {
  try {
    const [component] = await db.insert(vehicleHealthComponents)
      .values(data)
      .returning();
    
    // Update the vehicle health dashboard
    await updateVehicleHealthDashboard(data.carId);
    
    return component;
  } catch (error) {
    console.error("Error creating health component:", error);
    throw new Error("Failed to create health component");
  }
}

// Update an existing health component
export async function updateHealthComponent(id: number, data: Partial<z.infer<typeof insertVehicleHealthComponentSchema>>) {
  try {
    const [component] = await db.update(vehicleHealthComponents)
      .set(data)
      .where(eq(vehicleHealthComponents.id, id))
      .returning();
    
    // Update the vehicle health dashboard
    if (component) {
      await updateVehicleHealthDashboard(component.carId);
    }
    
    return component;
  } catch (error) {
    console.error("Error updating health component:", error);
    throw new Error("Failed to update health component");
  }
}

// Delete a health component
export async function deleteHealthComponent(id: number) {
  try {
    const [component] = await db.delete(vehicleHealthComponents)
      .where(eq(vehicleHealthComponents.id, id))
      .returning();
    
    // Update the vehicle health dashboard
    if (component) {
      await updateVehicleHealthDashboard(component.carId);
    }
    
    return component;
  } catch (error) {
    console.error("Error deleting health component:", error);
    throw new Error("Failed to delete health component");
  }
}

// Get health dashboard for a car
export async function getCarHealthDashboard(carId: number) {
  try {
    // Check if dashboard exists
    const dashboard = await db.query.vehicleHealthDashboard.findFirst({
      where: eq(vehicleHealthDashboard.carId, carId),
      with: {
        car: true
      }
    });
    
    if (!dashboard) {
      // Create initial dashboard if not exists
      return await createInitialDashboard(carId);
    }
    
    return dashboard;
  } catch (error) {
    console.error("Error fetching car health dashboard:", error);
    throw new Error("Failed to fetch car health dashboard");
  }
}

// Create initial dashboard with default values
async function createInitialDashboard(carId: number) {
  try {
    // Check if car exists
    const car = await db.query.cars.findFirst({
      where: eq(cars.id, carId)
    });
    
    if (!car) {
      throw new Error("Car not found");
    }
    
    const initialDashboard = {
      carId,
      overallHealth: HealthConditionStatus.GOOD,
      alerts: 0,
      healthScore: 100,
      recommendations: [],
      historyData: []
    };
    
    const [dashboard] = await db.insert(vehicleHealthDashboard)
      .values(initialDashboard)
      .returning();
    
    return dashboard;
  } catch (error) {
    console.error("Error creating initial dashboard:", error);
    throw new Error("Failed to create initial dashboard");
  }
}

// Update vehicle health dashboard based on component statuses
export async function updateVehicleHealthDashboard(carId: number) {
  try {
    // Get all components for the car
    const components = await db.query.vehicleHealthComponents.findMany({
      where: eq(vehicleHealthComponents.carId, carId)
    });
    
    if (components.length === 0) {
      return null; // No components to calculate
    }
    
    // Calculate health metrics
    let alertCount = 0;
    let totalHealthScore = 0;
    const criticalComponents = [];
    const recommendations = [];
    
    // Simple algorithm to calculate overall health
    for (const component of components) {
      if (component.alertLevel > 0) {
        alertCount++;
      }
      
      // Calculate component score based on status
      let componentScore = 0;
      switch (component.status) {
        case HealthConditionStatus.EXCELLENT:
          componentScore = 100;
          break;
        case HealthConditionStatus.GOOD:
          componentScore = 80;
          break;
        case HealthConditionStatus.FAIR:
          componentScore = 60;
          recommendations.push({
            component: component.componentName,
            recommendation: `Schedule a check for ${component.componentName} soon.`
          });
          break;
        case HealthConditionStatus.POOR:
          componentScore = 30;
          criticalComponents.push(component.componentName);
          recommendations.push({
            component: component.componentName,
            recommendation: `${component.componentName} needs immediate attention.`,
            urgent: true
          });
          break;
        case HealthConditionStatus.CRITICAL:
          componentScore = 0;
          criticalComponents.push(component.componentName);
          recommendations.push({
            component: component.componentName,
            recommendation: `${component.componentName} is in critical condition and needs replacement.`,
            urgent: true
          });
          break;
      }
      
      totalHealthScore += componentScore;
    }
    
    // Calculate average health score
    const averageHealthScore = Math.round(totalHealthScore / components.length);
    
    // Determine overall health status based on score and critical components
    let overallHealth: string = HealthConditionStatus.EXCELLENT;
    if (criticalComponents.length > 0) {
      overallHealth = HealthConditionStatus.CRITICAL;
    } else if (averageHealthScore < 20) {
      overallHealth = HealthConditionStatus.CRITICAL;
    } else if (averageHealthScore < 40) {
      overallHealth = HealthConditionStatus.POOR;
    } else if (averageHealthScore < 70) {
      overallHealth = HealthConditionStatus.FAIR;
    } else if (averageHealthScore < 90) {
      overallHealth = HealthConditionStatus.GOOD;
    }
    
    // Store historical data
    const historyEntry = {
      date: new Date(),
      score: averageHealthScore,
      alerts: alertCount
    };
    
    // Get or create dashboard
    const dashboard = await db.query.vehicleHealthDashboard.findFirst({
      where: eq(vehicleHealthDashboard.carId, carId),
    });
    
    if (dashboard) {
      // Update existing dashboard
      // Get existing history data and append new entry
      const historyData = Array.isArray(dashboard.historyData) 
        ? [...(dashboard.historyData as any[]), historyEntry]
        : [historyEntry];
        
      // Keep only the last 30 entries
      const trimmedHistory = historyData.slice(-30);
      
      const [updated] = await db.update(vehicleHealthDashboard)
        .set({
          overallHealth,
          lastUpdated: new Date(),
          alerts: alertCount,
          healthScore: averageHealthScore,
          recommendations: recommendations,
          historyData: trimmedHistory
        })
        .where(eq(vehicleHealthDashboard.carId, carId))
        .returning();
        
      return updated;
    } else {
      // Create new dashboard
      const [newDashboard] = await db.insert(vehicleHealthDashboard)
        .values({
          carId,
          overallHealth,
          alerts: alertCount,
          healthScore: averageHealthScore,
          recommendations: recommendations,
          historyData: [historyEntry]
        })
        .returning();
        
      return newDashboard;
    }
  } catch (error) {
    console.error("Error updating vehicle health dashboard:", error);
    throw new Error("Failed to update vehicle health dashboard");
  }
}

// Get all vehicle health dashboards for all cars
export async function getAllVehicleHealthDashboards() {
  try {
    const dashboards = await db.query.vehicleHealthDashboard.findMany({
      with: {
        car: true
      },
      orderBy: [desc(vehicleHealthDashboard.lastUpdated)]
    });
    
    return dashboards;
  } catch (error) {
    console.error("Error fetching all vehicle health dashboards:", error);
    throw new Error("Failed to fetch all vehicle health dashboards");
  }
}

// Get cars with critical health issues
export async function getCriticalVehicles() {
  try {
    const criticalDashboards = await db.query.vehicleHealthDashboard.findMany({
      where: eq(vehicleHealthDashboard.overallHealth, HealthConditionStatus.CRITICAL),
      with: {
        car: true
      }
    });
    
    return criticalDashboards;
  } catch (error) {
    console.error("Error fetching critical vehicles:", error);
    throw new Error("Failed to fetch critical vehicles");
  }
}

// Get cars that need attention (poor health or multiple alerts)
export async function getVehiclesNeedingAttention() {
  try {
    const concernDashboards = await db.query.vehicleHealthDashboard.findMany({
      where: or(
        eq(vehicleHealthDashboard.overallHealth, HealthConditionStatus.POOR),
        eq(vehicleHealthDashboard.overallHealth, HealthConditionStatus.FAIR),
        gt(vehicleHealthDashboard.alerts, 0)
      ),
      with: {
        car: true
      }
    });
    
    return concernDashboards;
  } catch (error) {
    console.error("Error fetching vehicles needing attention:", error);
    throw new Error("Failed to fetch vehicles needing attention");
  }
}