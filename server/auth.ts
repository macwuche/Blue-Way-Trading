import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { registerSchema, loginSchema } from "@shared/schema";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";

// Extend express-session types
declare module "express-session" {
  interface SessionData {
    userId?: string;
    user?: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      isAdmin: boolean | null;
      profileImageUrl: string | null;
    };
  }
}

const PgSession = connectPgSimple(session);
const SALT_ROUNDS = 10;

export function setupCustomAuth(app: Express) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const sessionStore = new PgSession({
    pool,
    tableName: "sessions",
    createTableIfMissing: false,
  });

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "bluewaytradingsecret123",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax",
      },
    })
  );
}

export function registerCustomAuthRoutes(app: Express) {
  // Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.errors 
        });
      }

      const { email, password, firstName, lastName, phone, country } = result.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        country,
        authProvider: "email",
        status: "active",
        isVerified: false,
        isAdmin: false,
      });

      // Create portfolio for new user
      await storage.createPortfolio({
        userId: user.id,
        balance: "10000.00",
        totalProfit: "0.00",
        totalProfitPercent: "0.00",
      });

      // Set session
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        profileImageUrl: user.profileImageUrl,
      };

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          profileImageUrl: user.profileImageUrl,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.errors 
        });
      }

      const { email, password } = result.data;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user has a password (for email auth)
      if (!user.password) {
        return res.status(401).json({ message: "Please use social login for this account" });
      }

      // Check if user is active
      if (user.status === "suspended") {
        return res.status(403).json({ message: "Your account has been suspended" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        profileImageUrl: user.profileImageUrl,
      };

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          profileImageUrl: user.profileImageUrl,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  // Demo login - creates or retrieves demo user and logs them in
  app.post("/api/auth/demo-login", async (req: Request, res: Response) => {
    try {
      const demoEmail = "demo@bluewaytrading.com";
      
      // Check if demo user exists
      let user = await storage.getUserByEmail(demoEmail);
      
      if (!user) {
        // Create demo user
        user = await storage.createUser({
          email: demoEmail,
          password: null,
          firstName: "Demo",
          lastName: "Trader",
          authProvider: "demo",
          status: "active",
          isVerified: true,
          isAdmin: false,
        });

        // Create portfolio for demo user
        await storage.createPortfolio({
          userId: user.id,
          balance: "10000.00",
          totalProfit: "0.00",
          totalProfitPercent: "0.00",
        });
      }

      // Set session
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        profileImageUrl: user.profileImageUrl,
      };

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          profileImageUrl: user.profileImageUrl,
        },
      });
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ message: "Failed to login with demo account" });
    }
  });

  // Get current user
  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.session.user);
  });

  // Check authentication status
  app.get("/api/auth/check", (req: Request, res: Response) => {
    res.json({
      authenticated: !!req.session.userId,
      user: req.session.user || null,
    });
  });
}

// Custom authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Attach user info to request for route handlers
  (req as any).user = {
    claims: {
      sub: req.session.userId,
    },
    ...req.session.user,
  };
  
  next();
}
