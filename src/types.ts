import { OrderStatus } from "@prisma/client";

export type UserMetadata = {
  username: string;
};

export type PurchaseEvent = {
  eventType: string;
  timestamp: string;
  data: PurchaseData;
};

export type PurchaseData = {
  order_id: string;
  customer_id: string;
  book_id: string;
  book_title: string;
  book_author: string;
  book_genre: string;
  purchase_date: string;
  order_status: OrderStatus;
};
