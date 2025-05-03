import { pgTable, text, serial, integer, boolean, timestamp, numeric, date, json, real, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define health condition status types
export const HealthConditionStatus = {
  EXCELLENT: "excellent",
  GOOD: "good",
  FAIR: "fair",
  POOR: "poor",
  CRITICAL: "critical",
} as const;

export type HealthStatus = typeof HealthConditionStatus[keyof typeof HealthConditionStatus];

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

// Car schema
export const cars = pgTable("cars", {
  id: serial("id").primaryKey(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  locationId: integer("location_id").notNull(),
  status: text("status").notNull().default("available"), // "available", "rented", "maintenance"
  carId: text("car_id").notNull().unique(), // Custom identifier like "CAR-2023-089"
  imageUrl: text("image_url"), // URL to the car image
});

export const insertCarSchema = createInsertSchema(cars).pick({
  make: true,
  model: true,
  year: true,
  locationId: true,
  status: true,
  carId: true,
  imageUrl: true,
});

// Location schema
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  name: true,
  address: true,
});

// Rental schema
export const rentals = pgTable("rentals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  carId: integer("car_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("active"), // "active", "completed", "cancelled"
});

export const insertRentalSchema = createInsertSchema(rentals).pick({
  userId: true,
  carId: true,
  startDate: true,
  endDate: true,
  status: true,
});

// Login history schema
export const loginHistory = pgTable("login_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertLoginHistorySchema = createInsertSchema(loginHistory).pick({
  userId: true,
  timestamp: true,
});

// Car Insurance schema
export const carInsurances = pgTable("car_insurances", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull(),
  policyNumber: text("policy_number").notNull().unique(),
  provider: text("provider").notNull(),
  coverageType: text("coverage_type").notNull(), // "Full Coverage", "Liability Only", "Collision", "Comprehensive"
  premium: numeric("premium").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  deductible: numeric("deductible").notNull(),
  coverageLimit: numeric("coverage_limit").notNull(),
});

export const insertCarInsuranceSchema = createInsertSchema(carInsurances, {
  startDate: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
  endDate: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
}).pick({
  carId: true,
  policyNumber: true,
  provider: true,
  coverageType: true,
  premium: true,
  startDate: true,
  endDate: true,
  deductible: true,
  coverageLimit: true,
});

// User Insurance schema (for drivers)
export const userInsurances = pgTable("user_insurances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  policyNumber: text("policy_number").notNull().unique(),
  provider: text("provider").notNull(),
  coverageType: text("coverage_type").notNull(), // "Full Coverage", "Liability Only", "Personal", "Comprehensive"
  premium: numeric("premium").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  liabilityCoverage: numeric("liability_coverage").notNull(),
  personalInjuryCoverage: numeric("personal_injury_coverage").notNull(),
});

export const insertUserInsuranceSchema = createInsertSchema(userInsurances, {
  startDate: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
  endDate: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
}).pick({
  userId: true,
  policyNumber: true,
  provider: true,
  coverageType: true,
  premium: true,
  startDate: true,
  endDate: true,
  liabilityCoverage: true,
  personalInjuryCoverage: true,
});

// 1. Car Maintenance Schema
export const carMaintenance = pgTable("car_maintenance", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull(),
  maintenanceType: text("maintenance_type").notNull(), // "Oil Change", "Tire Rotation", "Inspection", etc.
  description: text("description"),
  cost: numeric("cost").notNull(),
  serviceDate: timestamp("service_date").notNull(),
  nextServiceDate: timestamp("next_service_date"),
  serviceProvider: text("service_provider"),
  mileage: integer("mileage"),
  completed: boolean("completed").notNull().default(false),
  notes: text("notes"),
  documents: jsonb("documents"), // Store document URLs
});

export const insertCarMaintenanceSchema = createInsertSchema(carMaintenance).pick({
  carId: true,
  maintenanceType: true,
  description: true,
  cost: true,
  serviceDate: true,
  nextServiceDate: true,
  serviceProvider: true,
  mileage: true,
  completed: true,
  notes: true,
  documents: true,
});

// 2. Customer Reviews & Ratings
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  carId: integer("car_id").notNull(),
  rentalId: integer("rental_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 star rating
  comment: text("comment"),
  reviewDate: timestamp("review_date").notNull().defaultNow(),
  isPublic: boolean("is_public").notNull().default(true),
  verified: boolean("verified").notNull().default(false),
  features: jsonb("features"), // Feature ratings (comfort, cleanliness, etc.)
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  carId: true,
  rentalId: true,
  rating: true,
  comment: true,
  reviewDate: true,
  isPublic: true,
  verified: true,
  features: true,
});

// 3. Damage Reports
export const damageReports = pgTable("damage_reports", {
  id: serial("id").primaryKey(),
  rentalId: integer("rental_id").notNull(),
  reportType: text("report_type").notNull(), // "pickup", "return"
  reportDate: timestamp("report_date").notNull().defaultNow(),
  inspectorId: integer("inspector_id").notNull(), // User who conducted the inspection
  damageDetails: jsonb("damage_details").notNull(), // Structured damage info
  photos: jsonb("photos"), // Array of photo URLs
  notes: text("notes"),
  signatures: jsonb("signatures"), // Customer and staff signatures
  estimatedRepairCost: numeric("estimated_repair_cost"),
  actualRepairCost: numeric("actual_repair_cost"),
  status: text("status").notNull().default("pending"), // "pending", "resolved", "disputed"
});

export const insertDamageReportSchema = createInsertSchema(damageReports).pick({
  rentalId: true,
  reportType: true,
  reportDate: true,
  inspectorId: true,
  damageDetails: true,
  photos: true,
  notes: true,
  signatures: true,
  estimatedRepairCost: true,
  actualRepairCost: true,
  status: true,
});

// 4. Loyalty Program
export const loyaltyProgram = pgTable("loyalty_program", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pointsPerDollar: real("points_per_dollar").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
  tiers: jsonb("tiers").notNull(), // Different tiers in the program
  redemptionRules: jsonb("redemption_rules").notNull(),
});

export const insertLoyaltyProgramSchema = createInsertSchema(loyaltyProgram).pick({
  name: true,
  description: true,
  pointsPerDollar: true,
  createdAt: true,
  active: true,
  tiers: true,
  redemptionRules: true,
});

export const loyaltyPoints = pgTable("loyalty_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  programId: integer("program_id").notNull(),
  points: integer("points").notNull().default(0),
  tier: text("tier").notNull().default("Bronze"),
  joinDate: timestamp("join_date").notNull().defaultNow(),
  lastActivity: timestamp("last_activity"),
  expiryDate: timestamp("expiry_date"),
});

export const insertLoyaltyPointsSchema = createInsertSchema(loyaltyPoints).pick({
  userId: true,
  programId: true,
  points: true,
  tier: true,
  joinDate: true,
  lastActivity: true,
  expiryDate: true,
});

export const pointsTransactions = pgTable("points_transactions", {
  id: serial("id").primaryKey(),
  loyaltyPointsId: integer("loyalty_points_id").notNull(),
  transactionType: text("transaction_type").notNull(), // "earn", "redeem", "expire", "bonus"
  points: integer("points").notNull(),
  transactionDate: timestamp("transaction_date").notNull().defaultNow(),
  sourceId: integer("source_id"), // ID of rental, reward, etc.
  sourceType: text("source_type"), // "rental", "reward", etc.
  description: text("description"),
});

export const insertPointsTransactionSchema = createInsertSchema(pointsTransactions).pick({
  loyaltyPointsId: true,
  transactionType: true,
  points: true,
  transactionDate: true,
  sourceId: true,
  sourceType: true,
  description: true,
});

// 5. Car Availability & Calendar
export const carAvailability = pgTable("car_availability", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull(), // "available", "booked", "maintenance", "blocked"
  reason: text("reason"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCarAvailabilitySchema = createInsertSchema(carAvailability).pick({
  carId: true,
  startDate: true,
  endDate: true,
  status: true,
  reason: true,
  createdBy: true,
  createdAt: true,
});

// 6. Location Features for Location-based Search
export const locationFeatures = pgTable("location_features", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  hasAirportShuttle: boolean("has_airport_shuttle").default(false),
  has24HourPickup: boolean("has_24_hour_pickup").default(false),
  hasEarlyReturn: boolean("has_early_return").default(false),
  businessHours: jsonb("business_hours").notNull(), // Operating hours
  amenities: jsonb("amenities"), // WiFi, coffee, etc.
  parking: jsonb("parking"), // Type of parking available
  handicapAccessible: boolean("handicap_accessible").default(false),
  nearbyAttractions: jsonb("nearby_attractions"),
});

export const insertLocationFeaturesSchema = createInsertSchema(locationFeatures).pick({
  locationId: true,
  latitude: true,
  longitude: true,
  hasAirportShuttle: true,
  has24HourPickup: true,
  hasEarlyReturn: true,
  businessHours: true,
  amenities: true,
  parking: true,
  handicapAccessible: true,
  nearbyAttractions: true,
});

// Vehicle Health Monitoring System
export const vehicleHealthComponents = pgTable("vehicle_health_components", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull(),
  componentName: text("component_name").notNull(), // engine, brakes, transmission, etc.
  status: text("status").notNull(), // Using HealthStatus type values
  lastChecked: timestamp("last_checked").notNull().defaultNow(),
  nextCheckDue: timestamp("next_check_due"),
  notes: text("notes"),
  alertLevel: integer("alert_level").notNull().default(0), // 0-normal, 1-needs attention, 2-urgent
  diagnosisData: jsonb("diagnosis_data"), // Detailed diagnostic data
  updatedBy: integer("updated_by").notNull(),
});

export const insertVehicleHealthComponentSchema = createInsertSchema(vehicleHealthComponents).pick({
  carId: true,
  componentName: true,
  status: true,
  lastChecked: true,
  nextCheckDue: true,
  notes: true,
  alertLevel: true, 
  diagnosisData: true,
  updatedBy: true,
});

// Vehicle Health Dashboard
export const vehicleHealthDashboard = pgTable("vehicle_health_dashboard", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull(),
  overallHealth: text("overall_health").notNull(), // excellent, good, fair, poor, critical
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  alerts: integer("alerts").notNull().default(0), // Number of active alerts
  mileage: integer("mileage"),
  nextMaintenanceDue: timestamp("next_maintenance_due"),
  healthScore: integer("health_score").notNull().default(100), // 0-100 score
  recommendations: jsonb("recommendations"), // Array of recommendation objects
  historyData: jsonb("history_data"), // Historical health data
});

export const insertVehicleHealthDashboardSchema = createInsertSchema(vehicleHealthDashboard).pick({
  carId: true,
  overallHealth: true,
  lastUpdated: true,
  alerts: true,
  mileage: true,
  nextMaintenanceDue: true,
  healthScore: true,
  recommendations: true,
  historyData: true,
});

// 7. Car Features for Comparison
export const carFeatures = pgTable("car_features", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull(),
  fuelType: text("fuel_type").notNull(), // "Gasoline", "Diesel", "Hybrid", "Electric"
  transmission: text("transmission").notNull(), // "Automatic", "Manual"
  seating: integer("seating").notNull(),
  doors: integer("doors").notNull(),
  mpg: real("mpg"),
  trunkSpace: real("trunk_space"), // cubic feet
  hasGPS: boolean("has_gps").default(false),
  hasBluetoothAudio: boolean("has_bluetooth_audio").default(false),
  hasSunroof: boolean("has_sunroof").default(false),
  hasLeatherSeats: boolean("has_leather_seats").default(false),
  hasBackupCamera: boolean("has_backup_camera").default(false),
  features: jsonb("features"), // Additional features
  additionalImages: jsonb("additional_images"), // Array of image URLs
});

export const insertCarFeaturesSchema = createInsertSchema(carFeatures).pick({
  carId: true,
  fuelType: true,
  transmission: true,
  seating: true,
  doors: true,
  mpg: true,
  trunkSpace: true,
  hasGPS: true,
  hasBluetoothAudio: true,
  hasSunroof: true,
  hasLeatherSeats: true,
  hasBackupCamera: true,
  features: true,
  additionalImages: true,
});

// Define relations between tables
export const usersRelations = relations(users, ({ many }) => ({
  rentals: many(rentals),
  loginHistory: many(loginHistory),
  userInsurances: many(userInsurances),
  reviews: many(reviews),
  loyaltyPoints: many(loyaltyPoints),
}));

export const carsRelations = relations(cars, ({ one, many }) => ({
  location: one(locations, {
    fields: [cars.locationId],
    references: [locations.id],
  }),
  rentals: many(rentals),
  carInsurances: many(carInsurances),
  maintenanceRecords: many(carMaintenance),
  reviews: many(reviews),
  features: many(carFeatures),
  availability: many(carAvailability),
  healthComponents: many(vehicleHealthComponents),
  healthDashboard: one(vehicleHealthDashboard),
}));

// Vehicle Health Components Relations
export const vehicleHealthComponentsRelations = relations(vehicleHealthComponents, ({ one }) => ({
  car: one(cars, {
    fields: [vehicleHealthComponents.carId],
    references: [cars.id],
  }),
  updatedByUser: one(users, {
    fields: [vehicleHealthComponents.updatedBy],
    references: [users.id],
  }),
}));

// Vehicle Health Dashboard Relations
export const vehicleHealthDashboardRelations = relations(vehicleHealthDashboard, ({ one }) => ({
  car: one(cars, {
    fields: [vehicleHealthDashboard.carId],
    references: [cars.id],
  }),
}));

export const locationsRelations = relations(locations, ({ many, one }) => ({
  cars: many(cars),
  features: one(locationFeatures, {
    fields: [locations.id],
    references: [locationFeatures.locationId],
  }),
}));

export const rentalsRelations = relations(rentals, ({ one, many }) => ({
  user: one(users, {
    fields: [rentals.userId],
    references: [users.id],
  }),
  car: one(cars, {
    fields: [rentals.carId],
    references: [cars.id],
  }),
  reviews: many(reviews),
  damageReports: many(damageReports),
}));

export const loginHistoryRelations = relations(loginHistory, ({ one }) => ({
  user: one(users, {
    fields: [loginHistory.userId],
    references: [users.id],
  }),
}));

export const carInsurancesRelations = relations(carInsurances, ({ one }) => ({
  car: one(cars, {
    fields: [carInsurances.carId],
    references: [cars.id],
  }),
}));

export const userInsurancesRelations = relations(userInsurances, ({ one }) => ({
  user: one(users, {
    fields: [userInsurances.userId],
    references: [users.id],
  }),
}));

export const carMaintenanceRelations = relations(carMaintenance, ({ one }) => ({
  car: one(cars, {
    fields: [carMaintenance.carId],
    references: [cars.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  car: one(cars, {
    fields: [reviews.carId],
    references: [cars.id],
  }),
  rental: one(rentals, {
    fields: [reviews.rentalId],
    references: [rentals.id],
  }),
}));

export const damageReportsRelations = relations(damageReports, ({ one }) => ({
  rental: one(rentals, {
    fields: [damageReports.rentalId],
    references: [rentals.id],
  }),
  inspector: one(users, {
    fields: [damageReports.inspectorId],
    references: [users.id],
  }),
}));

export const loyaltyPointsRelations = relations(loyaltyPoints, ({ one, many }) => ({
  user: one(users, {
    fields: [loyaltyPoints.userId],
    references: [users.id],
  }),
  program: one(loyaltyProgram, {
    fields: [loyaltyPoints.programId],
    references: [loyaltyProgram.id],
  }),
  transactions: many(pointsTransactions),
}));

export const pointsTransactionsRelations = relations(pointsTransactions, ({ one }) => ({
  loyaltyPoints: one(loyaltyPoints, {
    fields: [pointsTransactions.loyaltyPointsId],
    references: [loyaltyPoints.id],
  }),
}));

export const carAvailabilityRelations = relations(carAvailability, ({ one }) => ({
  car: one(cars, {
    fields: [carAvailability.carId],
    references: [cars.id],
  }),
  createdByUser: one(users, {
    fields: [carAvailability.createdBy],
    references: [users.id],
  }),
}));

export const locationFeaturesRelations = relations(locationFeatures, ({ one }) => ({
  location: one(locations, {
    fields: [locationFeatures.locationId],
    references: [locations.id],
  }),
}));

export const carFeaturesRelations = relations(carFeatures, ({ one }) => ({
  car: one(cars, {
    fields: [carFeatures.carId],
    references: [cars.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Car = typeof cars.$inferSelect;
export type InsertCar = z.infer<typeof insertCarSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Rental = typeof rentals.$inferSelect;
export type InsertRental = z.infer<typeof insertRentalSchema>;

export type LoginHistory = typeof loginHistory.$inferSelect;
export type InsertLoginHistory = z.infer<typeof insertLoginHistorySchema>;

export type CarInsurance = typeof carInsurances.$inferSelect;
export type InsertCarInsurance = z.infer<typeof insertCarInsuranceSchema>;

export type UserInsurance = typeof userInsurances.$inferSelect;
export type InsertUserInsurance = z.infer<typeof insertUserInsuranceSchema>;

// New types for added features
export type CarMaintenance = typeof carMaintenance.$inferSelect;
export type InsertCarMaintenance = z.infer<typeof insertCarMaintenanceSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type DamageReport = typeof damageReports.$inferSelect;
export type InsertDamageReport = z.infer<typeof insertDamageReportSchema>;

export type LoyaltyProgram = typeof loyaltyProgram.$inferSelect;
export type InsertLoyaltyProgram = z.infer<typeof insertLoyaltyProgramSchema>;

export type LoyaltyPoints = typeof loyaltyPoints.$inferSelect;
export type InsertLoyaltyPoints = z.infer<typeof insertLoyaltyPointsSchema>;

export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type InsertPointsTransaction = z.infer<typeof insertPointsTransactionSchema>;

export type CarAvailability = typeof carAvailability.$inferSelect;
export type InsertCarAvailability = z.infer<typeof insertCarAvailabilitySchema>;

export type LocationFeatures = typeof locationFeatures.$inferSelect;
export type InsertLocationFeatures = z.infer<typeof insertLocationFeaturesSchema>;

export type CarFeatures = typeof carFeatures.$inferSelect;
export type InsertCarFeatures = z.infer<typeof insertCarFeaturesSchema>;

export type VehicleHealthComponent = typeof vehicleHealthComponents.$inferSelect;
export type InsertVehicleHealthComponent = z.infer<typeof insertVehicleHealthComponentSchema>;

export type VehicleHealthDashboard = typeof vehicleHealthDashboard.$inferSelect;
export type InsertVehicleHealthDashboard = z.infer<typeof insertVehicleHealthDashboardSchema>;
