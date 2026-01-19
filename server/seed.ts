import bcrypt from "bcrypt";
import { db } from "./db";
import { users, portfolios } from "@shared/schema";
import { eq } from "drizzle-orm";

const DEMO_USERS = [
  { firstName: "John", lastName: "Smith", email: "john.smith@demo.com" },
  { firstName: "Sarah", lastName: "Johnson", email: "sarah.johnson@demo.com" },
  { firstName: "Michael", lastName: "Brown", email: "michael.brown@demo.com" },
  { firstName: "Emily", lastName: "Davis", email: "emily.davis@demo.com" },
  { firstName: "David", lastName: "Wilson", email: "david.wilson@demo.com" },
  { firstName: "Jessica", lastName: "Taylor", email: "jessica.taylor@demo.com" },
];

const ADMIN_USER = {
  firstName: "Admin",
  lastName: "User",
  email: "admin@bluewaytrading.com",
  password: "admin123",
};

async function seedDatabase() {
  console.log("Starting database seed...");

  const adminPasswordHash = await bcrypt.hash(ADMIN_USER.password, 10);
  const existingAdmin = await db.select().from(users).where(eq(users.email, ADMIN_USER.email));
  
  if (existingAdmin.length === 0) {
    const [admin] = await db.insert(users).values({
      email: ADMIN_USER.email,
      password: adminPasswordHash,
      firstName: ADMIN_USER.firstName,
      lastName: ADMIN_USER.lastName,
      isAdmin: true,
      isVerified: true,
      status: "active",
      authProvider: "email",
    }).returning();
    
    await db.insert(portfolios).values({
      userId: admin.id,
      balance: "10000.00",
      totalProfit: "0.00",
      totalProfitPercent: "0.00",
    });
    
    console.log(`Created admin user: ${ADMIN_USER.email} (password: ${ADMIN_USER.password})`);
  } else {
    console.log(`Admin user already exists: ${ADMIN_USER.email}`);
  }

  for (const demoUser of DEMO_USERS) {
    const existing = await db.select().from(users).where(eq(users.email, demoUser.email));
    
    if (existing.length === 0) {
      const [user] = await db.insert(users).values({
        email: demoUser.email,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        isAdmin: false,
        isVerified: true,
        status: "active",
        authProvider: "demo",
      }).returning();
      
      await db.insert(portfolios).values({
        userId: user.id,
        balance: "1000.00",
        totalProfit: "0.00",
        totalProfitPercent: "0.00",
      });
      
      console.log(`Created demo user: ${demoUser.email} with $1,000 balance`);
    } else {
      console.log(`Demo user already exists: ${demoUser.email}`);
    }
  }

  console.log("Database seed completed!");
}

seedDatabase().catch(console.error);
