import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  customerOrders,
  customerProfiles,
  orderItems,
  productReviews,
} from "../../../db/schema";
import { getCatalogueProduct } from "../../catalogue-db";
import { getCustomerUser } from "../../customer-auth";

async function reviewEligibility(userId: string, productSlug: string) {
  const db = getDb();
  const [purchase] = await db
    .select({ orderId: customerOrders.id })
    .from(orderItems)
    .innerJoin(customerOrders, eq(orderItems.orderId, customerOrders.id))
    .where(
      and(
        eq(customerOrders.userId, userId),
        eq(customerOrders.paymentStatus, "paid"),
        eq(orderItems.productSlug, productSlug),
      ),
    )
    .limit(1);
  const [existing] = await db
    .select({ id: productReviews.id })
    .from(productReviews)
    .where(
      and(
        eq(productReviews.userId, userId),
        eq(productReviews.productSlug, productSlug),
      ),
    )
    .limit(1);
  return { purchase, existing };
}

export async function GET(request: Request) {
  const productSlug = new URL(request.url).searchParams
    .get("productSlug")
    ?.trim();
  if (!productSlug || !(await getCatalogueProduct(productSlug))) {
    return Response.json({ error: "Unknown product" }, { status: 404 });
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        id: productReviews.id,
        userName: productReviews.userName,
        rating: productReviews.rating,
        title: productReviews.title,
        body: productReviews.body,
        verifiedPurchase: productReviews.verifiedPurchase,
        createdAt: productReviews.createdAt,
      })
      .from(productReviews)
      .where(
        and(
          eq(productReviews.productSlug, productSlug),
          eq(productReviews.status, "approved"),
        ),
      )
      .orderBy(desc(productReviews.createdAt))
      .limit(30);
    const user = await getCustomerUser();
    const eligibility = user
      ? await reviewEligibility(user.userId, productSlug)
      : { purchase: null, existing: null };
    const averageRating = rows.length
      ? rows.reduce((sum, review) => sum + review.rating, 0) / rows.length
      : 0;

    return Response.json(
      {
        reviews: rows,
        summary: { averageRating, count: rows.length },
        signedIn: Boolean(user),
        canReview: Boolean(eligibility.purchase && !eligibility.existing),
        hasReviewed: Boolean(eligibility.existing),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json({
      reviews: [],
      summary: { averageRating: 0, count: 0 },
      signedIn: false,
      canReview: false,
      hasReviewed: false,
    });
  }
}

export async function POST(request: Request) {
  const user = await getCustomerUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as {
      productSlug?: string;
      rating?: number;
      title?: string;
      body?: string;
    };
    const productSlug = body.productSlug?.trim() ?? "";
    const rating = Number(body.rating);
    const title = body.title?.trim().slice(0, 90) ?? "";
    const reviewBody = body.body?.trim().slice(0, 1200) ?? "";
    if (
      !(await getCatalogueProduct(productSlug)) ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      title.length < 3 ||
      reviewBody.length < 20
    ) {
      return Response.json(
        { error: "Please add a rating, title and a little more detail" },
        { status: 400 },
      );
    }

    const eligibility = await reviewEligibility(user.userId, productSlug);
    if (eligibility.existing) {
      return Response.json(
        { error: "You have already reviewed this product" },
        { status: 409 },
      );
    }
    if (!eligibility.purchase) {
      return Response.json(
        { error: "Reviews are available after a paid purchase" },
        { status: 403 },
      );
    }

    const db = getDb();
    const [profile] = await db
      .select({ displayName: customerProfiles.displayName })
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, user.userId))
      .limit(1);
    const now = Date.now();
    const [created] = await db
      .insert(productReviews)
      .values({
        userId: user.userId,
        userName: profile?.displayName || user.displayName,
        productSlug,
        orderId: eligibility.purchase.orderId,
        rating,
        title,
        body: reviewBody,
        verifiedPurchase: true,
        status: "approved",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return Response.json({ review: created }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to save review" }, { status: 500 });
  }
}
