CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE "OrderStatus" AS ENUM ('MENUNGGU_QRIS', 'MENUNGGU_BAYAR', 'MENUNGGU_KONFIRMASI', 'DIBAYAR', 'DIPROSES', 'DIKIRIM', 'SELESAI', 'DIBATALKAN');
CREATE TYPE "PaymentMethod" AS ENUM ('BANK', 'QRIS');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'REJECTED');
CREATE TYPE "DeliverySlot" AS ENUM ('PAGI', 'SIANG', 'SORE');

CREATE TABLE "Profile" (
  "id" TEXT NOT NULL, "email" TEXT NOT NULL, "name" TEXT, "phone" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BankAccount" (
  "id" TEXT NOT NULL, "bankName" TEXT NOT NULL, "accountNumber" TEXT NOT NULL, "accountHolder" TEXT NOT NULL,
  "logoUrl" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0, "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "QrisAsset" (
  "id" TEXT NOT NULL, "amount" INTEGER NOT NULL, "imagePath" TEXT NOT NULL, "label" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QrisAsset_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Order" (
  "id" TEXT NOT NULL, "orderNumber" TEXT NOT NULL, "accessToken" TEXT NOT NULL, "userId" TEXT,
  "status" "OrderStatus" NOT NULL DEFAULT 'MENUNGGU_BAYAR', "customerName" TEXT NOT NULL, "customerEmail" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL, "recipientName" TEXT NOT NULL, "recipientPhone" TEXT NOT NULL,
  "address" TEXT NOT NULL, "city" TEXT NOT NULL, "postalCode" TEXT, "shippingZone" TEXT NOT NULL,
  "deliveryDate" DATE NOT NULL, "deliverySlot" "DeliverySlot" NOT NULL, "cardMessage" VARCHAR(200), "notes" TEXT,
  "subtotal" INTEGER NOT NULL, "shippingFee" INTEGER NOT NULL, "total" INTEGER NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "productId" TEXT, "variantId" TEXT, "productName" TEXT NOT NULL,
  "variantName" TEXT NOT NULL, "price" INTEGER NOT NULL, "qty" INTEGER NOT NULL, "imageUrl" TEXT NOT NULL,
  "cardNote" VARCHAR(200), CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Payment" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "method" "PaymentMethod" NOT NULL, "amount" INTEGER NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING', "bankAccountId" TEXT, "qrisAssetId" TEXT, "proofPath" TEXT,
  "proofUploadedAt" TIMESTAMP(3), "confirmedById" TEXT, "confirmedAt" TIMESTAMP(3), "rejectReason" TEXT,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OrderStatusLog" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "fromStatus" "OrderStatus", "toStatus" "OrderStatus" NOT NULL,
  "note" TEXT, "actorId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");
CREATE UNIQUE INDEX "QrisAsset_amount_key" ON "QrisAsset"("amount");
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");
CREATE INDEX "OrderStatusLog_orderId_createdAt_idx" ON "OrderStatusLog"("orderId", "createdAt");
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_qrisAssetId_fkey" FOREIGN KEY ("qrisAssetId") REFERENCES "QrisAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderStatusLog" ADD CONSTRAINT "OrderStatusLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BankAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QrisAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderStatusLog" ENABLE ROW LEVEL SECURITY;
