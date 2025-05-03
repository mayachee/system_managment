import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export const insertCarInsuranceSchema = createInsertSchema(carInsurances).pick({
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

export const insertUserInsuranceSchema = createInsertSchema(userInsurances).pick({
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

// Define relations between tables
export const usersRelations = relations(users, ({ many }) => ({
  rentals: many(rentals),
  loginHistory: many(loginHistory),
  userInsurances: many(userInsurances),
}));

export const carsRelations = relations(cars, ({ one, many }) => ({
  location: one(locations, {
    fields: [cars.locationId],
    references: [locations.id],
  }),
  rentals: many(rentals),
  carInsurances: many(carInsurances),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  cars: many(cars),
}));

export const rentalsRelations = relations(rentals, ({ one }) => ({
  user: one(users, {
    fields: [rentals.userId],
    references: [users.id],
  }),
  car: one(cars, {
    fields: [rentals.carId],
    references: [cars.id],
  }),
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
