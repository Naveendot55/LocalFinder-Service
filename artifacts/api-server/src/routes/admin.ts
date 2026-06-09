import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, usersTable, servicesTable, bookingsTable } from "@workspace/db";
import { ApproveServiceBody, ApproveServiceParams } from "@workspace/api-zod";
import { authenticate, requireRole, type AuthRequest } from "../middlewares/auth";
import { avg } from "drizzle-orm";
import { reviewsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/admin/stats", authenticate, requireRole("admin"), async (_req, res): Promise<void> => {
  const [totalUsersRow] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "user"));
  const [totalProvidersRow] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "provider"));
  const [totalServicesRow] = await db.select({ count: count() }).from(servicesTable).where(eq(servicesTable.status, "active"));
  const [totalBookingsRow] = await db.select({ count: count() }).from(bookingsTable);
  const [pendingServicesRow] = await db.select({ count: count() }).from(servicesTable).where(eq(servicesTable.status, "pending"));
  const [pendingBookingsRow] = await db.select({ count: count() }).from(bookingsTable).where(eq(bookingsTable.status, "pending"));

  res.json({
    totalUsers: Number(totalUsersRow?.count ?? 0),
    totalProviders: Number(totalProvidersRow?.count ?? 0),
    totalServices: Number(totalServicesRow?.count ?? 0),
    totalBookings: Number(totalBookingsRow?.count ?? 0),
    pendingServices: Number(pendingServicesRow?.count ?? 0),
    pendingBookings: Number(pendingBookingsRow?.count ?? 0),
  });
});

router.get("/admin/users", authenticate, requireRole("admin"), async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  res.json(users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })));
});

router.get("/admin/services", authenticate, requireRole("admin"), async (_req, res): Promise<void> => {
  const services = await db.select().from(servicesTable);
  const enriched = await Promise.all(
    services.map(async (service) => {
      const [provider] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, service.providerId));
      const [stats] = await db
        .select({ avgRating: avg(reviewsTable.rating), reviewCount: count(reviewsTable.id) })
        .from(reviewsTable)
        .where(eq(reviewsTable.serviceId, service.id));
      return {
        id: service.id,
        providerId: service.providerId,
        providerName: provider?.name ?? "Unknown",
        title: service.title,
        category: service.category,
        description: service.description,
        price: Number(service.price),
        location: service.location,
        status: service.status,
        rating: Number(stats?.avgRating ?? 0),
        reviewCount: Number(stats?.reviewCount ?? 0),
        createdAt: service.createdAt,
      };
    })
  );
  res.json(enriched);
});

router.put("/admin/services/:id/approve", authenticate, requireRole("admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = ApproveServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ApproveServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, params.data.id));
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  const [updated] = await db
    .update(servicesTable)
    .set({ status: parsed.data.status })
    .where(eq(servicesTable.id, params.data.id))
    .returning();
  const [provider] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.providerId));
  const [stats] = await db
    .select({ avgRating: avg(reviewsTable.rating), reviewCount: count(reviewsTable.id) })
    .from(reviewsTable)
    .where(eq(reviewsTable.serviceId, updated.id));
  res.json({
    id: updated.id,
    providerId: updated.providerId,
    providerName: provider?.name ?? "Unknown",
    title: updated.title,
    category: updated.category,
    description: updated.description,
    price: Number(updated.price),
    location: updated.location,
    status: updated.status,
    rating: Number(stats?.avgRating ?? 0),
    reviewCount: Number(stats?.reviewCount ?? 0),
    createdAt: updated.createdAt,
  });
});

export default router;
