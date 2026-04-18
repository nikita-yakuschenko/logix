-- Публичный 6-символьный код (A–Z, 0–9) для ссылок и устной передачи.
ALTER TABLE "Quote" ADD COLUMN "publicCode" TEXT;

CREATE UNIQUE INDEX "Quote_publicCode_key" ON "Quote"("publicCode");
