import dotenv from "dotenv";
import { PurchaseData, PurchaseEvent } from "./types";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const prisma = new PrismaClient();

export const getPurchasesByCustomerId = async (customerId: string) => {
  const purchases = await prisma.purchases.findMany({
    where: { customerId },
  });
  return purchases;
};

const createPurchaseItem = async (eventData: PurchaseData) => {
  const newOrder = await prisma.purchases.create({
    data: {
      orderId: eventData.order_id,
      customerId: eventData.customer_id,
      bookId: eventData.book_id,
      bookTitle: eventData.book_title,
      bookAuthor: eventData.book_author,
      bookGenre: eventData.book_genre,
      purchaseDate: eventData.purchase_date,
      orderStatus: eventData.order_status,
    },
  });
  console.log("✅ Successfully created purchase:", newOrder.id);
  return newOrder;
};

const updatePurchaseItem = async (eventData: PurchaseData) => {
  // First find the purchase by orderId
  const purchase = await prisma.purchases.findFirst({
    where: { orderId: eventData.order_id },
  });

  if (!purchase) {
    throw new Error(`Purchase with orderId ${eventData.order_id} not found`);
  }

  const updatedOrder = await prisma.purchases.update({
    where: { id: purchase.id },
    data: {
      orderStatus: eventData.order_status,
    },
  });
  console.log("🔄 Updated purchase:", updatedOrder.id);
  return updatedOrder;
};

export const processPurchaseEvent = async (event: PurchaseEvent) => {
  try {
    if (event.eventType === "ORDER_CREATED") {
      await createPurchaseItem(event.data);
    } else if (event.eventType === "ORDER_UPDATED") {
      await updatePurchaseItem(event.data);
    } else {
      console.warn("⚠️ Unknown event type:", event.eventType);
    }
  } catch (error) {
    console.error("❌ Error processing purchase event:", error);
  }
};
