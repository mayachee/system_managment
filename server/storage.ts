import { 
  User, InsertUser,
  Car, InsertCar,
  Location, InsertLocation,
  Rental, InsertRental,
  LoginHistory, InsertLoginHistory,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private cars: Map<number, Car>;
  private locations: Map<number, Location>;
  private rentals: Map<number, Rental>;
  private loginHistories: Map<number, LoginHistory>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private carIdCounter: number;
  private locationIdCounter: number;
  private rentalIdCounter: number;
  private loginHistoryIdCounter: number;

  constructor() {
    this.users = new Map();
    this.cars = new Map();
    this.locations = new Map();
    this.rentals = new Map();
    this.loginHistories = new Map();
    
    this.userIdCounter = 1;
    this.carIdCounter = 1;
    this.locationIdCounter = 1;
    this.rentalIdCounter = 1;
    this.loginHistoryIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h
    });
    
    // Add admin user on initialization
    this.createUser({
      username: "admin",
      password: "admin", // Will be hashed in auth.ts
      email: "admin@carrental.com",
      role: "admin"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Car operations
  async getCar(id: number): Promise<Car | undefined> {
    return this.cars.get(id);
  }

  async getCarByCarId(carId: string): Promise<Car | undefined> {
    return Array.from(this.cars.values()).find(car => car.carId === carId);
  }

  async createCar(car: InsertCar): Promise<Car> {
    const id = this.carIdCounter++;
    const newCar: Car = { ...car, id };
    this.cars.set(id, newCar);
    return newCar;
  }

  async updateCar(id: number, carData: Partial<Car>): Promise<Car | undefined> {
    const car = await this.getCar(id);
    if (!car) return undefined;
    
    const updatedCar = { ...car, ...carData };
    this.cars.set(id, updatedCar);
    return updatedCar;
  }

  async deleteCar(id: number): Promise<boolean> {
    return this.cars.delete(id);
  }

  async getAllCars(): Promise<Car[]> {
    return Array.from(this.cars.values());
  }

  async getAvailableCars(): Promise<Car[]> {
    return Array.from(this.cars.values()).filter(car => car.status === "available");
  }

  // Location operations
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const id = this.locationIdCounter++;
    const newLocation: Location = { ...location, id };
    this.locations.set(id, newLocation);
    return newLocation;
  }

  async updateLocation(id: number, locationData: Partial<Location>): Promise<Location | undefined> {
    const location = await this.getLocation(id);
    if (!location) return undefined;
    
    const updatedLocation = { ...location, ...locationData };
    this.locations.set(id, updatedLocation);
    return updatedLocation;
  }

  async deleteLocation(id: number): Promise<boolean> {
    return this.locations.delete(id);
  }

  async getAllLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  // Rental operations
  async getRental(id: number): Promise<Rental | undefined> {
    return this.rentals.get(id);
  }

  async createRental(rental: InsertRental): Promise<Rental> {
    const id = this.rentalIdCounter++;
    const newRental: Rental = { ...rental, id };
    this.rentals.set(id, newRental);
    
    // Update car status to rented
    const car = await this.getCar(rental.carId);
    if (car) {
      await this.updateCar(car.id, { status: "rented" });
    }
    
    return newRental;
  }

  async updateRental(id: number, rentalData: Partial<Rental>): Promise<Rental | undefined> {
    const rental = await this.getRental(id);
    if (!rental) return undefined;
    
    const updatedRental = { ...rental, ...rentalData };
    this.rentals.set(id, updatedRental);
    
    // If status is changing to completed, update car availability
    if (rentalData.status === "completed" && rental.status !== "completed") {
      const car = await this.getCar(rental.carId);
      if (car) {
        await this.updateCar(car.id, { status: "available" });
      }
    }
    
    return updatedRental;
  }

  async deleteRental(id: number): Promise<boolean> {
    return this.rentals.delete(id);
  }

  async getAllRentals(): Promise<Rental[]> {
    return Array.from(this.rentals.values());
  }

  async getUserRentals(userId: number): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter(rental => rental.userId === userId);
  }

  async isCarAvailable(carId: number, startDate: Date, endDate: Date, excludeRentalId?: number): Promise<boolean> {
    // Check if car exists and is available
    const car = await this.getCar(carId);
    if (!car || (car.status !== "available" && car.status !== "rented")) return false;
    
    // Find any overlapping rentals
    const overlappingRentals = Array.from(this.rentals.values()).filter(rental => {
      // Skip the current rental when checking (for updates)
      if (excludeRentalId && rental.id === excludeRentalId) return false;
      
      // Skip completed or cancelled rentals
      if (rental.status !== "active") return false;
      
      // Check for the same car
      if (rental.carId !== carId) return false;
      
      // Check for date overlap
      const rentalStart = new Date(rental.startDate);
      const rentalEnd = new Date(rental.endDate);
      
      return (
        (startDate >= rentalStart && startDate <= rentalEnd) || // Start date overlaps
        (endDate >= rentalStart && endDate <= rentalEnd) || // End date overlaps
        (startDate <= rentalStart && endDate >= rentalEnd) // Completely encompasses the rental
      );
    });
    
    return overlappingRentals.length === 0;
  }

  // Login history operations
  async getLoginHistory(id: number): Promise<LoginHistory | undefined> {
    return this.loginHistories.get(id);
  }

  async createLoginHistory(loginHistory: InsertLoginHistory): Promise<LoginHistory> {
    const id = this.loginHistoryIdCounter++;
    const newLoginHistory: LoginHistory = { ...loginHistory, id };
    this.loginHistories.set(id, newLoginHistory);
    return newLoginHistory;
  }

  async getUserLoginHistory(userId: number): Promise<LoginHistory[]> {
    return Array.from(this.loginHistories.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getAllLoginHistory(): Promise<LoginHistory[]> {
    return Array.from(this.loginHistories.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const storage = new MemStorage();
