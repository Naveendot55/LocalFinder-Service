import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bookingsTable, servicesTable, usersTable } from "@workspace/db";
import { CreateBookingBody, UpdateBookingStatusBody, UpdateBookingStatusParams } from "@workspace/api-zod";
import { authenticate, requireRole, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

async function enrichBooking(booking: typeof bookingsTable.$inferSelect) {
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, booking.serviceId));
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, booking.userId));
  const [provider] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, booking.providerId));
  return {
    id: booking.id,
    userId: booking.userId,
    serviceId: booking.serviceId,
    providerId: booking.providerId,
    status: booking.status,
    notes: booking.notes ?? null,
    userName: user?.name ?? "Unknown",
    serviceName: service?.title ?? "Unknown",
    serviceCategory: service?.category ?? "Unknown",
    servicePrice: Number(service?.price ?? 0),
    providerName: provider?.name ?? "Unknown",
    createdAt: booking.createdAt,
  };
}

router.post("/bookings", authenticate, requireRole("user"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, parsed.data.serviceId));
  if (!service || service.status !== "active") {
    res.status(404).json({ error: "Service not found or not active" });
    return;
  }
  const [booking] = await db
    .insert(bookingsTable)
    .values({
      userId: req.user!.id,
      serviceId: parsed.data.serviceId,
      providerId: service.providerId,
      notes: parsed.data.notes ?? null,
    })
    .returning();
  res.status(201).json(await enrichBooking(booking));
});

router.get("/bookings/user", authenticate, requireRole("user"), async (req: AuthRequest, res): Promise<void> => {
  const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.userId, req.user!.id));
  const enriched = await Promise.all(bookings.map(enrichBooking));
  res.json(enriched);
});

router.get("/bookings/provider", authenticate, requireRole("provider"), async (req: AuthRequest, res): Promise<void> => {
  const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.providerId, req.user!.id));
  const enriched = await Promise.all(bookings.map(enrichBooking));
  res.json(enriched);
});

router.put("/bookings/:id", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateBookingStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBookingStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  const userId = req.user!.id;
  const role = req.user!.role;
  if (role === "provider" && booking.providerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (role === "user" && booking.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [updated] = await db
    .update(bookingsTable)
    .set({ status: parsed.data.status })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();
  res.json(await enrichBooking(updated));
});

export default router;
