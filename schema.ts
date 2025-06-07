import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  json,
  decimal,
  date,
  primaryKey,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").notNull().unique(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  fullName: varchar("full_name"),
  phone: varchar("phone"),
  company: varchar("company"),
  role: varchar("role").default("client"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  verificationToken: varchar("verification_token"),
  verified: boolean("verified").default(false),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
});

// Services table (types of services offered)
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  priceType: varchar("price_type").default("fixed"), // fixed, hourly, range
  priceRange: varchar("price_range"),
  duration: integer("duration"),
  durationType: varchar("duration_type").default("days"), // days, weeks, months
  features: text("features").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client services (services purchased by clients)
export const clientServices = pgTable("client_services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  status: varchar("status").default("pending"), // pending, active, completed, cancelled
  purchaseDate: timestamp("purchase_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  renewalDate: timestamp("renewal_date"),
  notes: text("notes"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quote requests
export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  company: varchar("company"),
  serviceType: varchar("service_type").notNull(),
  message: text("message").notNull(),
  status: varchar("status").default("pending"), // pending, reviewed, quoted, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotes (sent to clients)
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteRequestId: integer("quote_request_id").references(() => quoteRequests.id),
  userId: integer("user_id").references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  validUntil: timestamp("valid_until").notNull(),
  status: varchar("status").default("sent"), // sent, viewed, accepted, rejected, expired
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  quoteId: integer("quote_id").references(() => quotes.id),
  clientServiceId: integer("client_service_id").references(() => clientServices.id),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  title: varchar("title").notNull(),
  description: text("description"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status").default("unpaid"), // unpaid, paid, overdue, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(), // mpesa, paypal, bank, etc.
  transactionId: varchar("transaction_id"),
  status: varchar("status").default("completed"), // pending, completed, failed
  paymentDate: timestamp("payment_date").defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Portfolio items
export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(),
  imageUrl: varchar("image_url").notNull(),
  websiteUrl: varchar("website_url"),
  clientName: varchar("client_name"),
  completionDate: date("completion_date"),
  featured: boolean("featured").default(false),
  technologies: text("technologies").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Testimonials
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name").notNull(),
  clientCompany: varchar("client_company"),
  clientTitle: varchar("client_title"),
  profileImage: varchar("profile_image"),
  content: text("content").notNull(),
  rating: integer("rating").default(5),
  projectType: varchar("project_type"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Emails
export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  to: varchar("to").notNull(),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  status: varchar("status").default("sent"), // sent, failed, delivered, opened
  type: varchar("type"), // notification, newsletter, reminder, etc.
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Web packages
export const webPackages = pgTable("web_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  priceRange: varchar("price_range").notNull(),
  features: text("features").array(),
  pagesIncluded: integer("pages_included").default(1),
  revisions: integer("revisions").default(1),
  deliveryTime: varchar("delivery_time"),
  supportPeriod: varchar("support_period"),
  featured: boolean("featured").default(false),
  popular: boolean("popular").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hosting packages
export const hostingPackages = pgTable("hosting_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  priceRange: varchar("price_range").notNull(),
  storageSpace: varchar("storage_space").notNull(),
  bandwidth: varchar("bandwidth").notNull(),
  emailAccounts: integer("email_accounts").default(0),
  features: text("features").array(),
  supportPeriod: varchar("support_period"),
  featured: boolean("featured").default(false),
  popular: boolean("popular").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Billing plans
export const billingPlans = pgTable("billing_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  frequency: varchar("frequency").notNull(), // monthly, quarterly, biannually, annually
  daysInCycle: integer("days_in_cycle").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reminder templates
export const reminderTemplates = pgTable("reminder_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // upcoming, overdue, renewal
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  daysOffset: integer("days_offset").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recurring invoices
export const recurringInvoices = pgTable("recurring_invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  billingPlanId: integer("billing_plan_id").notNull().references(() => billingPlans.id),
  title: varchar("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  lastBilledDate: timestamp("last_billed_date"),
  nextBillingDate: timestamp("next_billing_date").notNull(),
  status: varchar("status").default("active"), // active, paused, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reminder logs
export const reminderLogs = pgTable("reminder_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  recurringInvoiceId: integer("recurring_invoice_id").references(() => recurringInvoices.id),
  reminderTemplateId: integer("reminder_template_id").references(() => reminderTemplates.id),
  emailId: integer("email_id").references(() => emails.id),
  sentAt: timestamp("sent_at").defaultNow(),
  status: varchar("status").default("sent"), // sent, failed
  type: varchar("type").notNull(), // upcoming, overdue, renewal
  createdAt: timestamp("created_at").defaultNow(),
});

// Contact info
export const contactInfo = pgTable("contact_info", {
  id: serial("id").primaryKey(),
  phoneNumber1: varchar("phone_number1").notNull(),
  phoneNumber2: varchar("phone_number2"),
  email: varchar("email").notNull(),
  location: varchar("location").notNull(),
  googleMapLink: varchar("google_map_link"),
  updatedAt: timestamp("updated_at"),
});

// About us
export const aboutUs = pgTable("about_us", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  subtitle: varchar("subtitle"),
  content: text("content").notNull(),
  mission: text("mission"),
  vision: text("vision"),
  values: text("values"),
  updatedAt: timestamp("updated_at"),
});

// Team members
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  position: varchar("position").notNull(),
  bio: text("bio"),
  imageUrl: varchar("image_url"),
  email: varchar("email"),
  socialLinks: json("social_links"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics data
export const analyticsData = pgTable("analytics_data", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  pageViews: integer("page_views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 2 }).default("0"),
  topSourcesData: json("top_sources_data"),
  visitorsByLocation: json("visitors_by_location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientServiceSchema = createInsertSchema(clientServices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailSchema = createInsertSchema(emails).omit({ id: true, createdAt: true });
export const insertWebPackageSchema = createInsertSchema(webPackages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHostingPackageSchema = createInsertSchema(hostingPackages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBillingPlanSchema = createInsertSchema(billingPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReminderTemplateSchema = createInsertSchema(reminderTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRecurringInvoiceSchema = createInsertSchema(recurringInvoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReminderLogSchema = createInsertSchema(reminderLogs).omit({ id: true, createdAt: true });
export const insertContactInfoSchema = createInsertSchema(contactInfo).omit({ id: true, updatedAt: true });
export const insertAboutUsSchema = createInsertSchema(aboutUs).omit({ id: true, updatedAt: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnalyticsDataSchema = createInsertSchema(analyticsData).omit({ id: true, createdAt: true, updatedAt: true });

// Define insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertClientService = z.infer<typeof insertClientServiceSchema>;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type InsertWebPackage = z.infer<typeof insertWebPackageSchema>;
export type InsertHostingPackage = z.infer<typeof insertHostingPackageSchema>;
export type InsertBillingPlan = z.infer<typeof insertBillingPlanSchema>;
export type InsertReminderTemplate = z.infer<typeof insertReminderTemplateSchema>;
export type InsertRecurringInvoice = z.infer<typeof insertRecurringInvoiceSchema>;
export type InsertReminderLog = z.infer<typeof insertReminderLogSchema>;
export type InsertContactInfo = z.infer<typeof insertContactInfoSchema>;
export type InsertAboutUs = z.infer<typeof insertAboutUsSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type InsertAnalyticsData = z.infer<typeof insertAnalyticsDataSchema>;

// Define select types
export type User = typeof users.$inferSelect;
export type Service = typeof services.$inferSelect;
export type ClientService = typeof clientServices.$inferSelect;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Email = typeof emails.$inferSelect;
export type WebPackage = typeof webPackages.$inferSelect;
export type HostingPackage = typeof hostingPackages.$inferSelect;
export type BillingPlan = typeof billingPlans.$inferSelect;
export type ReminderTemplate = typeof reminderTemplates.$inferSelect;
export type RecurringInvoice = typeof recurringInvoices.$inferSelect;
export type ReminderLog = typeof reminderLogs.$inferSelect;
export type ContactInfo = typeof contactInfo.$inferSelect;
export type AboutUs = typeof aboutUs.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type AnalyticsData = typeof analyticsData.$inferSelect;

// Define relations between tables
/* 
// Example of relations (to be implemented when needed)
export const usersRelations = relations(users, ({ many }) => ({
  clientServices: many(clientServices),
  quoteRequests: many(quoteRequests),
  quotes: many(quotes),
  invoices: many(invoices),
  payments: many(payments),
}));
*/