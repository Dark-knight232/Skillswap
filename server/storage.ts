import {
  type User, type InsertUser,
  type Skill, type InsertSkill,
  type SkillMatch, type InsertMatch,
  type Message, type InsertMessage,
  type Event, type InsertEvent,
  type Review, type InsertReview,
  type Notification, type InsertNotification
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  
  // Skills
  getSkill(id: string): Promise<Skill | undefined>;
  getSkillsByUser(userId: string): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  updateSkill(id: string, skill: Partial<Skill>): Promise<Skill | undefined>;
  deleteSkill(id: string): Promise<boolean>;
  
  // Skill Matches
  getMatch(id: string): Promise<SkillMatch | undefined>;
  getMatchesByUser(userId: string): Promise<SkillMatch[]>;
  createMatch(match: InsertMatch): Promise<SkillMatch>;
  updateMatch(id: string, status: string): Promise<SkillMatch | undefined>;
  
  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]>;
  getConversationsByUser(userId: string): Promise<any[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message | undefined>;
  
  // Events
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByUser(userId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  
  // Reviews
  getReview(id: string): Promise<Review | undefined>;
  getReviewsByUser(userId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Notifications
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private skills: Map<string, Skill>;
  private matches: Map<string, SkillMatch>;
  private messages: Map<string, Message>;
  private events: Map<string, Event>;
  private reviews: Map<string, Review>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.skills = new Map();
    this.matches = new Map();
    this.messages = new Map();
    this.events = new Map();
    this.reviews = new Map();
    this.notifications = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      rating: 0,
      totalReviews: 0,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Skills
  async getSkill(id: string): Promise<Skill | undefined> {
    return this.skills.get(id);
  }

  async getSkillsByUser(userId: string): Promise<Skill[]> {
    return Array.from(this.skills.values()).filter(
      (skill) => skill.userId === userId,
    );
  }

  async createSkill(insertSkill: InsertSkill): Promise<Skill> {
    const id = randomUUID();
    const skill: Skill = {
      ...insertSkill,
      id,
      createdAt: new Date(),
    };
    this.skills.set(id, skill);
    return skill;
  }

  async updateSkill(id: string, updates: Partial<Skill>): Promise<Skill | undefined> {
    const skill = this.skills.get(id);
    if (!skill) return undefined;
    
    const updatedSkill = { ...skill, ...updates };
    this.skills.set(id, updatedSkill);
    return updatedSkill;
  }

  async deleteSkill(id: string): Promise<boolean> {
    return this.skills.delete(id);
  }

  // Skill Matches
  async getMatch(id: string): Promise<SkillMatch | undefined> {
    return this.matches.get(id);
  }

  async getMatchesByUser(userId: string): Promise<SkillMatch[]> {
    return Array.from(this.matches.values()).filter(
      (match) => match.userId === userId || match.matchedUserId === userId,
    );
  }

  async createMatch(insertMatch: InsertMatch): Promise<SkillMatch> {
    const id = randomUUID();
    const match: SkillMatch = {
      ...insertMatch,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.matches.set(id, match);
    return match;
  }

  async updateMatch(id: string, status: string): Promise<SkillMatch | undefined> {
    const match = this.matches.get(id);
    if (!match) return undefined;
    
    const updatedMatch = { ...match, status };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(
        (msg) =>
          (msg.senderId === user1Id && msg.receiverId === user2Id) ||
          (msg.senderId === user2Id && msg.receiverId === user1Id),
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getConversationsByUser(userId: string): Promise<any[]> {
    const userMessages = Array.from(this.messages.values()).filter(
      (msg) => msg.senderId === userId || msg.receiverId === userId,
    );

    const partnersMap = new Map<string, { lastMessage: Message; unreadCount: number }>();

    for (const msg of userMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const existing = partnersMap.get(partnerId);
      
      if (!existing || msg.createdAt > existing.lastMessage.createdAt) {
        const unreadCount = userMessages.filter(
          (m) => m.senderId === partnerId && m.receiverId === userId && !m.read
        ).length;
        
        partnersMap.set(partnerId, {
          lastMessage: msg,
          unreadCount,
        });
      }
    }

    const conversations = await Promise.all(
      Array.from(partnersMap.entries()).map(async ([partnerId, data]) => {
        const partner = await this.getUser(partnerId);
        return {
          partnerId,
          partner,
          lastMessage: data.lastMessage,
          unreadCount: data.unreadCount,
        };
      })
    );

    return conversations.sort(
      (a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      read: false,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, read: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Events
  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventsByUser(userId: string): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter((event) => event.userId === userId || event.partnerId === userId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      ...insertEvent,
      id,
      createdAt: new Date(),
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  // Reviews
  async getReview(id: string): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter((review) => review.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = randomUUID();
    const review: Review = {
      ...insertReview,
      id,
      createdAt: new Date(),
    };
    this.reviews.set(id, review);
    
    // Update user rating (stored as integer * 10, e.g., 45 for 4.5)
    const user = await this.getUser(insertReview.userId);
    if (user) {
      const userReviews = await this.getReviewsByUser(insertReview.userId);
      const totalRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / userReviews.length;
      
      await this.updateUser(insertReview.userId, {
        rating: Math.round(avgRating * 10), // Store as integer * 10
        totalReviews: userReviews.length,
      });
    }
    
    return review;
  }

  // Notifications
  async getNotification(id: string): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      read: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const userNotifications = await this.getNotificationsByUser(userId);
    for (const notification of userNotifications) {
      await this.markNotificationAsRead(notification.id);
    }
  }
}

export const storage = new MemStorage();
