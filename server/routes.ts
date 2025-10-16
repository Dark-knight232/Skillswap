import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertSkillSchema,
  insertMatchSchema,
  insertMessageSchema,
  insertEventSchema,
  insertReviewSchema,
  insertNotificationSchema,
} from "@shared/schema";
import { updateProfileSchema, updateSkillSchema, updateEventSchema } from "@shared/validation-schemas";
import { z } from "zod";

// Auth schemas
const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const signupSchema = insertUserSchema;

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== Authentication =====
  
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(data);
      
      // In a real app, we'd hash the password and set up session/JWT here
      // For now, just return the created user (without password)
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(data.username);
      if (!user || user.password !== data.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, we'd verify hashed password and set up session/JWT
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    // In a real app, we'd destroy the session/invalidate JWT
    res.json({ message: "Logged out successfully" });
  });

  // ===== Users / Profile =====
  
  app.get("/api/profile/:userId", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/profile", async (req, res) => {
    try {
      // In a real app, we'd get userId from session/JWT
      const userId = req.body.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Validate only allowed fields
      const validatedData = updateProfileSchema.parse(req.body);
      const user = await storage.updateUser(userId, validatedData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Skills =====
  
  app.get("/api/skills", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      const skills = await storage.getSkillsByUser(userId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/skills", async (req, res) => {
    try {
      const data = insertSkillSchema.parse(req.body);
      const skill = await storage.createSkill(data);
      res.json(skill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/skills/:id", async (req, res) => {
    try {
      const validatedData = updateSkillSchema.parse(req.body);
      const skill = await storage.updateSkill(req.params.id, validatedData);
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      res.json(skill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/skills/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSkill(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Skill not found" });
      }
      res.json({ message: "Skill deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Skill Matches =====
  
  app.get("/api/matches", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      const matches = await storage.getMatchesByUser(userId);
      
      // Enrich matches with user and skill details
      const enrichedMatches = await Promise.all(
        matches.map(async (match) => {
          const matchedUser = await storage.getUser(match.matchedUserId);
          const userSkill = await storage.getSkill(match.userSkillId);
          const matchedSkill = await storage.getSkill(match.matchedSkillId);
          
          return {
            ...match,
            matchedUser: matchedUser ? {
              id: matchedUser.id,
              username: matchedUser.username,
              fullName: matchedUser.fullName,
              avatarUrl: matchedUser.avatarUrl,
              rating: matchedUser.rating,
              totalReviews: matchedUser.totalReviews,
            } : null,
            userSkill,
            matchedSkill,
          };
        })
      );
      
      res.json(enrichedMatches);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/matches/request", async (req, res) => {
    try {
      const data = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(data);
      
      // Create notification for matched user
      await storage.createNotification({
        userId: data.matchedUserId,
        type: "match",
        title: "New Skill Trade Request",
        message: "Someone wants to exchange skills with you",
        relatedId: match.id,
      });
      
      res.json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/matches/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "status is required" });
      }
      
      const match = await storage.updateMatch(req.params.id, status);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Messages =====
  
  app.get("/api/messages/:conversationPartnerId", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      const messages = await storage.getMessagesBetweenUsers(
        userId,
        req.params.conversationPartnerId
      );
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/conversations", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      const conversations = await storage.getConversationsByUser(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const data = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(data);
      
      // Create notification for receiver
      await storage.createNotification({
        userId: data.receiverId,
        type: "message",
        title: "New Message",
        message: "You have a new message",
        relatedId: message.id,
      });
      
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Events / Calendar =====
  
  app.get("/api/events", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      const events = await storage.getEventsByUser(userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const data = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(data);
      
      // Create notification for partner
      await storage.createNotification({
        userId: data.partnerId,
        type: "reminder",
        title: "New Session Scheduled",
        message: `You have a new session: ${data.title}`,
        relatedId: event.id,
      });
      
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const validatedData = updateEventSchema.parse(req.body);
      const event = await storage.updateEvent(req.params.id, validatedData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Reviews =====
  
  app.get("/api/reviews/:userId", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByUser(req.params.userId);
      
      // Enrich reviews with reviewer details
      const enrichedReviews = await Promise.all(
        reviews.map(async (review) => {
          const reviewer = await storage.getUser(review.reviewerId);
          return {
            ...review,
            reviewer: reviewer ? {
              id: reviewer.id,
              username: reviewer.username,
              fullName: reviewer.fullName,
              avatarUrl: reviewer.avatarUrl,
            } : null,
          };
        })
      );
      
      res.json(enrichedReviews);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const data = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(data);
      
      // Create notification for reviewed user
      await storage.createNotification({
        userId: data.userId,
        type: "review",
        title: "New Review",
        message: `You received a ${data.rating}-star review`,
        relatedId: review.id,
      });
      
      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Notifications =====
  
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/notifications/read-all", async (req, res) => {
    try {
      const userId = req.body.userId;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
