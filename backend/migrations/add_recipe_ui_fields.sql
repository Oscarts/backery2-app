-- Add image URL and overhead percentage fields to Recipe model
ALTER TABLE "recipes" ADD COLUMN "image_url" TEXT;
ALTER TABLE "recipes" ADD COLUMN "overhead_percentage" FLOAT DEFAULT 20;