import { Router, type IRouter } from "express";
import { eq, and, ilike, gte, lte, avg, count, sql } from "drizzle-orm";
import { db, servicesTable, usersTable, reviewsTable } from "@workspace/db";
import {
  CreateServiceBody,
  UpdateServiceBody,
  GetServiceParams,
  UpdateServiceParams,
  DeleteServiceParams,
  ListServicesQueryParams,
} from "@workspace/api-zod";
import { authenticate, requireRole, type AuthRequest } from "../middlewares/auth";
import { bookingsTable } from "@workspace/db";

const router: IRouter = Router();

function buildServiceResponse(service: typeof servicesTable.$inferSelect, providerName: string, rating: number, reviewCount: number) {
  return {
    id: service.id,
    providerId: service.providerId,
    providerName,
    title: service.title,
    category: service.category,
    description: service.description,
    price: Number(service.price),
    location: service.location,
    status: service.status,
    rating,
    reviewCount,
    createdAt: service.createdAt,
  };
}

async function enrichService(service: typeof servicesTable.$inferSelect) {
  const [provider] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, service.providerId));
  const [stats] = await db
    .select({ avg: avg(reviewsTable.rating), count: count(reviewsTable.id) })
    .from(reviewsTable)
    .where(eq(reviewsTable.serviceId, service.id));
  return buildServiceResponse(service, provider?.name ?? "Unknown", Number(stats?.avg ?? 0), Number(stats?.count ?? 0));
}

router.get("/services", async (req, res): Promise<void> => {
  const params = ListServicesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { category, location, search, minPrice, maxPrice } = params.data;

  const conditions = [eq(servicesTable.status, "active")];
  if (category) conditions.push(eq(servicesTable.category, category));
  if (location) conditions.push(ilike(servicesTable.location, `%${location}%`));
  if (search) conditions.push(ilike(servicesTable.title, `%${search}%`));
  if (minPrice != null) conditions.push(gte(servicesTable.price, String(minPrice)));
  if (maxPrice != null) conditions.push(lte(servicesTable.price, String(maxPrice)));

  const services = await db.select().from(servicesTable).where(and(...conditions));
  const enriched = await Promise.all(services.map(enrichService));
  res.json(enriched);
});

router.get("/services/categories", async (_req, res): Promise<void> => {
  const results = await db
    .select({ category: servicesTable.category, count: count(servicesTable.id) })
    .from(servicesTable)
    .where(eq(servicesTable.status, "active"))
    .groupBy(servicesTable.category);
  res.json(results);
});

router.get("/services/featured", async (_req, res): Promise<void> => {
  const services = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.status, "active"))
    .limit(6);
  const enriched = await Promise.all(services.map(enrichService));
  enriched.sort((a, b) => b.rating - a.rating);
  res.json(enriched);
});

router.get("/provider/services", authenticate, requireRole("provider"), async (req: AuthRequest, res): Promise<void> => {
  const services = await db.select().from(servicesTable).where(eq(servicesTable.providerId, req.user!.id));
  const enriched = await Promise.all(services.map(enrichService));
  res.json(enriched);
});

router.get("/provider/stats", authenticate, requireRole("provider"), async (req: AuthRequest, res): Promise<void> => {
  const services = await db.select().from(servicesTable).where(eq(servicesTable.providerId, req.user!.id));
  const serviceIds = services.map((s) => s.id);

  let totalBookings = 0, pendingBookings = 0, acceptedBookings = 0, completedBookings = 0, averageRating = 0;

  if (serviceIds.length > 0) {
    const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.providerId, req.user!.id));
    totalBookings = bookings.length;
    pendingBookings = bookings.filter((b) => b.status === "pending").length;
    acceptedBookings = bookings.filter((b) => b.status === "accepted").length;
    completedBookings = bookings.filter((b) => b.status === "completed").length;

    const allReviews = await Promise.all(
      serviceIds.map((id) => db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(eq(reviewsTable.serviceId, id)))
    );
    const flatReviews = allReviews.flat();
    averageRating = flatReviews.length > 0 ? flatReviews.reduce((s, r) => s + r.rating, 0) / flatReviews.length : 0;
  }

  res.json({
    totalServices: services.length,
    totalBookings,
    pendingBookings,
    acceptedBookings,
    completedBookings,
    averageRating,
  });
});

router.get("/services/:id", async (req, res): Promise<void> => {
  const params = GetServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, params.data.id));
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(await enrichService(service));
});

router.post("/services", authenticate, requireRole("provider"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [service] = await db
    .insert(servicesTable)
    .values({ ...parsed.data, providerId: req.user!.id, price: String(parsed.data.price) })
    .returning();
  res.status(201).json(await enrichService(service));
});

router.put("/services/:id", authenticate, requireRole("provider"), async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db.select().from(servicesTable).where(and(eq(servicesTable.id, params.data.id), eq(servicesTable.providerId, req.user!.id)));
  if (!existing) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  const updateData: Partial<typeof servicesTable.$inferInsert> = {};
  if (parsed.data.title != null) updateData.title = parsed.data.title;
  if (parsed.data.category != null) updateData.category = parsed.data.category;
  if (parsed.data.description != null) updateData.description = parsed.data.description;
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);
  if (parsed.data.location != null) updateData.location = parsed.data.location;

  const [updated] = await db.update(servicesTable).set(updateData).where(eq(servicesTable.id, params.data.id)).returning();
  res.json(await enrichService(updated));
});

router.delete("/services/:id", authenticate, requireRole("provider"), async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db.select().from(servicesTable).where(and(eq(servicesTable.id, params.data.id), eq(servicesTable.providerId, req.user!.id)));
  if (!existing) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  await db.delete(servicesTable).where(eq(servicesTable.id, params.data.id));
  res.json({ message: "Service deleted" });
});

export default router;
