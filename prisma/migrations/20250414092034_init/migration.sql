-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateTable
CREATE TABLE "Purchases" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "book_title" TEXT NOT NULL,
    "book_author" TEXT NOT NULL,
    "book_genre" TEXT NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "order_status" "OrderStatus" NOT NULL,

    CONSTRAINT "Purchases_pkey" PRIMARY KEY ("id")
);
