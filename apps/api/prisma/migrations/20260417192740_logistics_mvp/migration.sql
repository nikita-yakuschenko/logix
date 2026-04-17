-- CreateEnum
CREATE TYPE "DistanceSource" AS ENUM ('ROUTING_API', 'MANUAL_OVERRIDE');

-- CreateTable
CREATE TABLE "VehicleType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffRule" (
    "id" TEXT NOT NULL,
    "vehicleTypeId" TEXT NOT NULL,
    "ratePerKm" DECIMAL(12,4) NOT NULL,
    "minimumTotal" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "destinationAddress" TEXT,
    "destinationLat" DOUBLE PRECISION,
    "destinationLng" DOUBLE PRECISION,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "distanceSource" "DistanceSource" NOT NULL,
    "routingMeta" JSONB,
    "inputLines" JSONB NOT NULL,
    "breakdown" JSONB NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleType_code_key" ON "VehicleType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TariffRule_vehicleTypeId_key" ON "TariffRule"("vehicleTypeId");

-- CreateIndex
CREATE INDEX "Quote_createdAt_idx" ON "Quote"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "TariffRule" ADD CONSTRAINT "TariffRule_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
