import { 
  User, InsertUser,
  Car, InsertCar,
  Location, InsertLocation,
  Rental, InsertRental,
  LoginHistory, InsertLoginHistory,
  CarInsurance, InsertCarInsurance,
  UserInsurance, InsertUserInsurance,
  users, cars, locations, rentals, loginHistory, carInsurances, userInsurances
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, or, gte, lte, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Car operations
  getCar(id: number): Promise<Car | undefined>;
  getCarByCarId(carId: string): Promise<Car | undefined>;
  createCar(car: InsertCar): Promise<Car>;
  updateCar(id: number, car: Partial<Car>): Promise<Car | undefined>;
  deleteCar(id: number): Promise<boolean>;
  getAllCars(): Promise<Car[]>;
  getAvailableCars(): Promise<Car[]>;
  
  // Location operations
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, location: Partial<Location>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;
  getAllLocations(): Promise<Location[]>;
  
  // Rental operations
  getRental(id: number): Promise<Rental | undefined>;
  createRental(rental: InsertRental): Promise<Rental>;
  updateRental(id: number, rental: Partial<Rental>): Promise<Rental | undefined>;
  deleteRental(id: number): Promise<boolean>;
  getAllRentals(): Promise<Rental[]>;
  getUserRentals(userId: number): Promise<Rental[]>;
  isCarAvailable(carId: number, startDate: Date, endDate: Date, excludeRentalId?: number): Promise<boolean>;
  
  // Login history operations
  getLoginHistory(id: number): Promise<LoginHistory | undefined>;
  createLoginHistory(loginHistory: InsertLoginHistory): Promise<LoginHistory>;
  getUserLoginHistory(userId: number): Promise<LoginHistory[]>;
  getAllLoginHistory(): Promise<LoginHistory[]>;
  
  // Car Insurance operations
  getCarInsurance(id: number): Promise<CarInsurance | undefined>;
  getCarInsuranceByCarId(carId: number): Promise<CarInsurance | undefined>;
  createCarInsurance(insurance: InsertCarInsurance): Promise<CarInsurance>;
  updateCarInsurance(id: number, insurance: Partial<CarInsurance>): Promise<CarInsurance | undefined>;
  deleteCarInsurance(id: number): Promise<boolean>;
  getAllCarInsurances(): Promise<CarInsurance[]>;
  
  // User Insurance operations
  getUserInsurance(id: number): Promise<UserInsurance | undefined>;
  getUserInsuranceByUserId(userId: number): Promise<UserInsurance | undefined>;
  createUserInsurance(insurance: InsertUserInsurance): Promise<UserInsurance>;
  updateUserInsurance(id: number, insurance: Partial<UserInsurance>): Promise<UserInsurance | undefined>;
  deleteUserInsurance(id: number): Promise<boolean>;
  getAllUserInsurances(): Promise<UserInsurance[]>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'session'
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Car operations
  async getCar(id: number): Promise<Car | undefined> {
    const result = await db.select().from(cars).where(eq(cars.id, id));
    return result[0];
  }

  async getCarByCarId(carId: string): Promise<Car | undefined> {
    const result = await db.select().from(cars).where(eq(cars.carId, carId));
    return result[0];
  }

  async createCar(car: InsertCar): Promise<Car> {
    const result = await db.insert(cars).values(car).returning();
    return result[0];
  }

  async updateCar(id: number, carData: Partial<Car>): Promise<Car | undefined> {
    const result = await db.update(cars)
      .set(carData)
      .where(eq(cars.id, id))
      .returning();
    return result[0];
  }

  async deleteCar(id: number): Promise<boolean> {
    const result = await db.delete(cars).where(eq(cars.id, id));
    return !!result;
  }

  async getAllCars(): Promise<Car[]> {
    return await db.select().from(cars);
  }

  async getAvailableCars(): Promise<Car[]> {
    return await db.select().from(cars).where(eq(cars.status, "available"));
  }

  // Location operations
  async getLocation(id: number): Promise<Location | undefined> {
    const result = await db.select().from(locations).where(eq(locations.id, id));
    return result[0];
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const result = await db.insert(locations).values(location).returning();
    return result[0];
  }

  async updateLocation(id: number, locationData: Partial<Location>): Promise<Location | undefined> {
    const result = await db.update(locations)
      .set(locationData)
      .where(eq(locations.id, id))
      .returning();
    return result[0];
  }

  async deleteLocation(id: number): Promise<boolean> {
    const result = await db.delete(locations).where(eq(locations.id, id));
    return !!result;
  }

  async getAllLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  // Rental operations
  async getRental(id: number): Promise<Rental | undefined> {
    const result = await db.select().from(rentals).where(eq(rentals.id, id));
    return result[0];
  }

  async createRental(rental: InsertRental): Promise<Rental> {
    // First create the rental
    const result = await db.insert(rentals).values(rental).returning();
    const newRental = result[0];
    
    // Then update the car status to rented
    await db.update(cars)
      .set({ status: "rented" })
      .where(eq(cars.id, rental.carId));
    
    return newRental;
  }

  async updateRental(id: number, rentalData: Partial<Rental>): Promise<Rental | undefined> {
    // Get the current rental
    const [currentRental] = await db.select().from(rentals).where(eq(rentals.id, id));
    if (!currentRental) return undefined;
    
    // Update the rental
    const result = await db.update(rentals)
      .set(rentalData)
      .where(eq(rentals.id, id))
      .returning();
    
    // If status is changing to completed, update car availability
    if (rentalData.status === "completed" && currentRental.status !== "completed") {
      await db.update(cars)
        .set({ status: "available" })
        .where(eq(cars.id, currentRental.carId));
    }
    
    return result[0];
  }

  async deleteRental(id: number): Promise<boolean> {
    const result = await db.delete(rentals).where(eq(rentals.id, id));
    return !!result;
  }

  async getAllRentals(): Promise<Rental[]> {
    return await db.select().from(rentals);
  }

  async getUserRentals(userId: number): Promise<Rental[]> {
    return await db.select().from(rentals).where(eq(rentals.userId, userId));
  }

  async isCarAvailable(carId: number, startDate: Date, endDate: Date, excludeRentalId?: number): Promise<boolean> {
    // Check if car exists and is available
    const [car] = await db.select().from(cars).where(eq(cars.id, carId));
    if (!car || (car.status !== "available" && car.status !== "rented")) return false;
    
    // Convert dates to strings for comparison
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    // Build query with raw SQL conditions to avoid type issues
    let query = `
      SELECT * FROM rentals 
      WHERE car_id = $1 
      AND status = 'active'
      AND (
        (start_date >= $2 AND start_date <= $3) OR
        (end_date >= $2 AND end_date <= $3) OR
        (start_date <= $2 AND end_date >= $3)
      )
    `;
    
    const params: any[] = [carId, startDateStr, endDateStr];
    
    // Add exclusion if needed
    if (excludeRentalId) {
      query += ` AND id != $4`;
      params.push(excludeRentalId);
    }
    
    // Execute the query
    const { rows: overlappingRentals } = await pool.query(query, params);
    
    return overlappingRentals.length === 0;
  }

  // Login history operations
  async getLoginHistory(id: number): Promise<LoginHistory | undefined> {
    const result = await db.select().from(loginHistory).where(eq(loginHistory.id, id));
    return result[0];
  }

  async createLoginHistory(history: InsertLoginHistory): Promise<LoginHistory> {
    const result = await db.insert(loginHistory).values(history).returning();
    return result[0];
  }

  async getUserLoginHistory(userId: number): Promise<LoginHistory[]> {
    return await db.select()
      .from(loginHistory)
      .where(eq(loginHistory.userId, userId))
      .orderBy(desc(loginHistory.timestamp));
  }

  async getAllLoginHistory(): Promise<LoginHistory[]> {
    return await db.select()
      .from(loginHistory)
      .orderBy(desc(loginHistory.timestamp));
  }

  // Car Insurance operations
  async getCarInsurance(id: number): Promise<CarInsurance | undefined> {
    const result = await db.select().from(carInsurances).where(eq(carInsurances.id, id));
    return result[0];
  }

  async getCarInsuranceByCarId(carId: number): Promise<CarInsurance | undefined> {
    const result = await db.select().from(carInsurances).where(eq(carInsurances.carId, carId));
    return result[0];
  }

  async createCarInsurance(insurance: InsertCarInsurance): Promise<CarInsurance> {
    const result = await db.insert(carInsurances).values(insurance).returning();
    return result[0];
  }

  async updateCarInsurance(id: number, insuranceData: Partial<CarInsurance>): Promise<CarInsurance | undefined> {
    const result = await db.update(carInsurances)
      .set(insuranceData)
      .where(eq(carInsurances.id, id))
      .returning();
    return result[0];
  }

  async deleteCarInsurance(id: number): Promise<boolean> {
    const result = await db.delete(carInsurances).where(eq(carInsurances.id, id));
    return !!result;
  }

  async getAllCarInsurances(): Promise<CarInsurance[]> {
    return await db.select().from(carInsurances);
  }

  // User Insurance operations
  async getUserInsurance(id: number): Promise<UserInsurance | undefined> {
    const result = await db.select().from(userInsurances).where(eq(userInsurances.id, id));
    return result[0];
  }

  async getUserInsuranceByUserId(userId: number): Promise<UserInsurance | undefined> {
    const result = await db.select().from(userInsurances).where(eq(userInsurances.userId, userId));
    return result[0];
  }

  async createUserInsurance(insurance: InsertUserInsurance): Promise<UserInsurance> {
    const result = await db.insert(userInsurances).values(insurance).returning();
    return result[0];
  }

  async updateUserInsurance(id: number, insuranceData: Partial<UserInsurance>): Promise<UserInsurance | undefined> {
    const result = await db.update(userInsurances)
      .set(insuranceData)
      .where(eq(userInsurances.id, id))
      .returning();
    return result[0];
  }

  async deleteUserInsurance(id: number): Promise<boolean> {
    const result = await db.delete(userInsurances).where(eq(userInsurances.id, id));
    return !!result;
  }

  async getAllUserInsurances(): Promise<UserInsurance[]> {
    return await db.select().from(userInsurances);
  }
}

// Initialize database storage with admin user
export const storage = new DatabaseStorage();

// This function is called when the server starts up to ensure admin user exists
async function initializeDb() {
  try {
    // Check if admin user exists
    const adminUser = await storage.getUserByUsername("admin");
    
    // If no admin, create one
    if (!adminUser) {
      console.log("Creating admin user...");
      await storage.createUser({
        username: "admin",
        password: "admin", // Will be hashed in auth.ts
        email: "admin@carrental.com",
        role: "admin"
      });
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Call the initialization function
initializeDb();
