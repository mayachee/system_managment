import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  insertCarSchema, 
  insertLocationSchema,
  insertRentalSchema, 
  insertUserSchema,
  insertLoginHistorySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Auth middleware for protected routes
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Admin middleware for admin-only routes
  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const [cars, rentals, users, locations] = await Promise.all([
        storage.getAllCars(),
        storage.getAllRentals(),
        storage.getAllUsers(),
        storage.getAllLocations()
      ]);

      const activeRentals = rentals.filter(rental => rental.status === "active");
      
      // Return user-specific stats if not admin
      if (req.user.role !== "admin") {
        const userRentals = await storage.getUserRentals(req.user.id);
        return res.json({
          userRentals: userRentals.length,
          activeUserRentals: userRentals.filter(r => r.status === "active").length,
          completedUserRentals: userRentals.filter(r => r.status === "completed").length,
          availableCars: cars.filter(car => car.status === "available").length
        });
      }
      
      // Admin gets full stats
      res.json({
        cars: cars.length,
        availableCars: cars.filter(car => car.status === "available").length,
        rentedCars: cars.filter(car => car.status === "rented").length,
        maintenanceCars: cars.filter(car => car.status === "maintenance").length,
        totalRentals: rentals.length,
        activeRentals: activeRentals.length,
        completedRentals: rentals.filter(rental => rental.status === "completed").length,
        users: users.length,
        locations: locations.length
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Dashboard recent activity
  app.get("/api/dashboard/activity", requireAuth, async (req, res) => {
    try {
      // Get recent login history for admins
      const loginHistory = req.user.role === "admin" 
        ? await storage.getAllLoginHistory() 
        : await storage.getUserLoginHistory(req.user.id);
        
      // Get recent rentals
      const rentals = req.user.role === "admin"
        ? await storage.getAllRentals()
        : await storage.getUserRentals(req.user.id);
        
      // Combine and sort by timestamp
      const activities = [
        ...loginHistory.map(log => ({
          type: "login",
          userId: log.userId,
          timestamp: log.timestamp,
          id: `login-${log.id}`
        })),
        ...rentals.map(rental => ({
          type: "rental",
          userId: rental.userId,
          carId: rental.carId,
          status: rental.status,
          startDate: rental.startDate,
          endDate: rental.endDate,
          timestamp: rental.startDate,
          id: `rental-${rental.id}`
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, 10); // Limit to 10 activities
      
      // Fetch additional data for the activities
      const populatedActivities = await Promise.all(activities.map(async (activity) => {
        const user = await storage.getUser(activity.userId);
        let car = null;
        
        if (activity.type === "rental" && activity.carId) {
          car = await storage.getCar(activity.carId);
        }
        
        return {
          ...activity,
          user: user ? { 
            id: user.id, 
            username: user.username, 
            email: user.email, 
            role: user.role 
          } : null,
          car: car ? {
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            carId: car.carId,
            status: car.status
          } : null
        };
      }));
      
      res.json(populatedActivities);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Dashboard popular cars
  app.get("/api/dashboard/popular-cars", requireAuth, async (req, res) => {
    try {
      const [cars, rentals] = await Promise.all([
        storage.getAllCars(),
        storage.getAllRentals()
      ]);
      
      // Count rentals for each car
      const carRentalCounts = cars.map(car => {
        const carRentals = rentals.filter(rental => rental.carId === car.id);
        return {
          ...car,
          rentalCount: carRentals.length,
          rating: (4 + Math.random()).toFixed(1) // Simulate a rating between 4.0-5.0
        };
      });
      
      // Sort by rental count (most popular first)
      const popularCars = carRentalCounts
        .sort((a, b) => b.rentalCount - a.rentalCount)
        .slice(0, 5); // Limit to top 5
      
      res.json(popularCars);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // Cars routes
  // Get all cars
  app.get("/api/cars", requireAuth, async (req, res) => {
    try {
      const cars = await storage.getAllCars();
      
      // Attach location data to each car
      const carsWithLocation = await Promise.all(cars.map(async (car) => {
        const location = await storage.getLocation(car.locationId);
        return {
          ...car,
          location: location || null
        };
      }));
      
      res.json(carsWithLocation);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Get car by ID
  app.get("/api/cars/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const car = await storage.getCar(id);
      
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
      
      const location = await storage.getLocation(car.locationId);
      
      res.json({
        ...car,
        location: location || null
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Create car (admin only)
  app.post("/api/cars", requireAdmin, async (req, res) => {
    try {
      const carData = insertCarSchema.parse(req.body);
      
      // Check if location exists
      const location = await storage.getLocation(carData.locationId);
      if (!location) {
        return res.status(400).json({ message: "Invalid location ID" });
      }
      
      // Check if carId is unique
      const existingCar = await storage.getCarByCarId(carData.carId);
      if (existingCar) {
        return res.status(400).json({ message: "Car ID already exists" });
      }
      
      const car = await storage.createCar(carData);
      res.status(201).json(car);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Update car (admin only)
  app.put("/api/cars/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const car = await storage.getCar(id);
      
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
      
      // Validate the update data
      const updateData = req.body;
      
      // If locationId is being updated, check if it exists
      if (updateData.locationId) {
        const location = await storage.getLocation(updateData.locationId);
        if (!location) {
          return res.status(400).json({ message: "Invalid location ID" });
        }
      }
      
      // If carId is being updated, check if it's unique
      if (updateData.carId && updateData.carId !== car.carId) {
        const existingCar = await storage.getCarByCarId(updateData.carId);
        if (existingCar) {
          return res.status(400).json({ message: "Car ID already exists" });
        }
      }
      
      const updatedCar = await storage.updateCar(id, updateData);
      res.json(updatedCar);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Delete car (admin only)
  app.delete("/api/cars/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const car = await storage.getCar(id);
      
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
      
      // Check if car is currently rented
      if (car.status === "rented") {
        return res.status(400).json({ message: "Cannot delete a rented car" });
      }
      
      await storage.deleteCar(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Locations routes
  // Get all locations
  app.get("/api/locations", requireAuth, async (req, res) => {
    try {
      const locations = await storage.getAllLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Get location by ID
  app.get("/api/locations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const location = await storage.getLocation(id);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Create location (admin only)
  app.post("/api/locations", requireAdmin, async (req, res) => {
    try {
      const locationData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(locationData);
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Update location (admin only)
  app.put("/api/locations/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const location = await storage.getLocation(id);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      const updateData = req.body;
      const updatedLocation = await storage.updateLocation(id, updateData);
      res.json(updatedLocation);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Delete location (admin only)
  app.delete("/api/locations/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const location = await storage.getLocation(id);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      // Check if any cars are assigned to this location
      const cars = await storage.getAllCars();
      const locationCars = cars.filter(car => car.locationId === id);
      
      if (locationCars.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete location with assigned cars. Reassign or delete the cars first." 
        });
      }
      
      await storage.deleteLocation(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Rentals routes
  // Get all rentals (admin gets all, users get their own)
  app.get("/api/rentals", requireAuth, async (req, res) => {
    try {
      let rentals;
      
      if (req.user.role === "admin") {
        rentals = await storage.getAllRentals();
      } else {
        rentals = await storage.getUserRentals(req.user.id);
      }
      
      // Attach car and user data to each rental
      const populatedRentals = await Promise.all(rentals.map(async (rental) => {
        const [car, user] = await Promise.all([
          storage.getCar(rental.carId),
          storage.getUser(rental.userId)
        ]);
        
        return {
          ...rental,
          car: car ? {
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            carId: car.carId,
            status: car.status,
            locationId: car.locationId
          } : null,
          user: user ? {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          } : null
        };
      }));
      
      res.json(populatedRentals);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Get rental by ID
  app.get("/api/rentals/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rental = await storage.getRental(id);
      
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      
      // Users can only view their own rentals
      if (req.user.role !== "admin" && rental.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const [car, user] = await Promise.all([
        storage.getCar(rental.carId),
        storage.getUser(rental.userId)
      ]);
      
      res.json({
        ...rental,
        car: car ? {
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          carId: car.carId,
          status: car.status,
          locationId: car.locationId
        } : null,
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Check car availability
  app.get("/api/cars/:id/availability", requireAuth, async (req, res) => {
    try {
      const carId = parseInt(req.params.id);
      const car = await storage.getCar(carId);
      
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
      
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      if (startDate >= endDate) {
        return res.status(400).json({ message: "Start date must be before end date" });
      }
      
      const isAvailable = await storage.isCarAvailable(carId, startDate, endDate);
      
      res.json({ available: isAvailable });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Create rental
  app.post("/api/rentals", requireAuth, async (req, res) => {
    try {
      const rentalData = insertRentalSchema.parse({
        ...req.body,
        userId: req.user.role === "admin" && req.body.userId ? req.body.userId : req.user.id,
      });
      
      // Check if car exists
      const car = await storage.getCar(rentalData.carId);
      if (!car) {
        return res.status(400).json({ message: "Invalid car ID" });
      }
      
      // Check if car is available for the requested dates
      const startDate = new Date(rentalData.startDate);
      const endDate = new Date(rentalData.endDate);
      
      if (startDate >= endDate) {
        return res.status(400).json({ message: "Start date must be before end date" });
      }
      
      const isAvailable = await storage.isCarAvailable(car.id, startDate, endDate);
      if (!isAvailable) {
        return res.status(400).json({ message: "Car is not available for the selected dates" });
      }
      
      const rental = await storage.createRental(rentalData);
      
      // Get car and user details for response
      const [updatedCar, user] = await Promise.all([
        storage.getCar(rental.carId),
        storage.getUser(rental.userId)
      ]);
      
      res.status(201).json({
        ...rental,
        car: updatedCar ? {
          id: updatedCar.id,
          make: updatedCar.make,
          model: updatedCar.model,
          year: updatedCar.year,
          carId: updatedCar.carId,
          status: updatedCar.status,
          locationId: updatedCar.locationId
        } : null,
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        } : null
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Update rental
  app.put("/api/rentals/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rental = await storage.getRental(id);
      
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      
      // Users can only update their own rentals
      if (req.user.role !== "admin" && rental.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check dates if they're being updated
      if (req.body.startDate || req.body.endDate) {
        const startDate = new Date(req.body.startDate || rental.startDate);
        const endDate = new Date(req.body.endDate || rental.endDate);
        
        if (startDate >= endDate) {
          return res.status(400).json({ message: "Start date must be before end date" });
        }
        
        // Check availability if dates are changing (and not for completed rentals)
        if (rental.status !== "completed" && 
            (startDate.getTime() !== new Date(rental.startDate).getTime() || 
             endDate.getTime() !== new Date(rental.endDate).getTime())) {
          const isAvailable = await storage.isCarAvailable(
            rental.carId, 
            startDate, 
            endDate,
            rental.id // Exclude current rental from availability check
          );
          
          if (!isAvailable) {
            return res.status(400).json({ message: "Car is not available for the selected dates" });
          }
        }
      }
      
      const updateData = req.body;
      const updatedRental = await storage.updateRental(id, updateData);
      
      const [car, user] = await Promise.all([
        storage.getCar(updatedRental.carId),
        storage.getUser(updatedRental.userId)
      ]);
      
      res.json({
        ...updatedRental,
        car: car ? {
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          carId: car.carId,
          status: car.status,
          locationId: car.locationId
        } : null,
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Delete rental (admin only)
  app.delete("/api/rentals/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rental = await storage.getRental(id);
      
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      
      await storage.deleteRental(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Users routes (admin only)
  // Get all users
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from the response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Get user by ID
  app.get("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from the response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Create user (admin only)
  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const hashedPassword = await (async (pwd) => {
        const salt = randomBytes(16).toString("hex");
        const buf = await promisify(scrypt)(pwd, salt, 64) as Buffer;
        return `${buf.toString("hex")}.${salt}`;
      })(userData.password);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Remove password from the response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Update user (admin only)
  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updateData = { ...req.body };
      
      // If username is being updated, check if it's unique
      if (updateData.username && updateData.username !== user.username) {
        const existingUser = await storage.getUserByUsername(updateData.username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      // If password is being updated, hash it
      if (updateData.password) {
        updateData.password = await (async (pwd) => {
          const salt = randomBytes(16).toString("hex");
          const buf = await promisify(scrypt)(pwd, salt, 64) as Buffer;
          return `${buf.toString("hex")}.${salt}`;
        })(updateData.password);
      }
      
      const updatedUser = await storage.updateUser(id, updateData);
      
      // Remove password from the response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Delete user (admin only)
  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deleting the last admin
      if (user.role === "admin") {
        const users = await storage.getAllUsers();
        const adminUsers = users.filter(u => u.role === "admin");
        
        if (adminUsers.length <= 1) {
          return res.status(400).json({ message: "Cannot delete the last admin user" });
        }
      }
      
      // Check if user has active rentals
      const rentals = await storage.getUserRentals(id);
      const activeRentals = rentals.filter(rental => rental.status === "active");
      
      if (activeRentals.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete user with active rentals. Complete or cancel the rentals first." 
        });
      }
      
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Login history routes (admin only)
  app.get("/api/login-history", requireAdmin, async (req, res) => {
    try {
      const loginHistory = await storage.getAllLoginHistory();
      
      // Attach user data to each login record
      const populatedHistory = await Promise.all(loginHistory.map(async (record) => {
        const user = await storage.getUser(record.userId);
        
        return {
          ...record,
          user: user ? {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          } : null
        };
      }));
      
      res.json(populatedHistory);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Get login history for a specific user
  app.get("/api/users/:id/login-history", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const loginHistory = await storage.getUserLoginHistory(userId);
      
      res.json(loginHistory);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
