import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, reviewsTable, usersTable, bookingsTable } from "@workspace/db";
import { CreateReviewBody, GetServiceReviewsParams } from "@workspace/api-zod";
import { authenticate, requireRole, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/reviews", authenticate, requireRole("user"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existingReview] = await db.select().from(reviewsTable).where(
    and(eq(reviewsTable.userId, req.user!.id), eq(reviewsTable.serviceId, parsed.data.serviceId))
  );
  if (existingReview) {
    res.status(400).json({ error: "You have already reviewed this service" });
    return;
  }
  const [completedBooking] = await db.select().from(bookingsTable).where(
    and(
      eq(bookingsTable.userId, req.user!.id),
      eq(bookingsTable.serviceId, parsed.data.serviceId),
      eq(bookingsTable.status, "completed")
    )
  );
  if (!completedBooking) {
    res.status(403).json({ error: "You can only review services with a completed booking" });
    return;
  }
  const [review] = await db
    .insert(reviewsTable)
    .values({ userId: req.user!.id, serviceId: parsed.data.serviceId, rating: parsed.data.rating, comment: parsed.data.comment })
    .returning();
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.user!.id));
  res.status(201).json({ ...review, userName: user?.name ?? "Unknown" });
});

router.get("/reviews/:serviceId", async (req, res): Promise<void> => {
  const params = GetServiceReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.serviceId, params.data.serviceId));
  const enriched = await Promise.all(
    reviews.map(async (review) => {
      const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, review.userId));
      return { ...review, userName: user?.name ?? "Unknown" };
    })
  );
  res.json(enriched);
});

export default router;
