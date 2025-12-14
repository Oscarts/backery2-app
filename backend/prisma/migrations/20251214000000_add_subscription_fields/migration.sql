-- Add subscription fields to clients table

-- Add enum types for subscription
CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- Add subscription columns to clients table
ALTER TABLE "clients" ADD COLUMN "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'TRIAL';
ALTER TABLE "clients" ADD COLUMN "maxUsers" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "clients" ADD COLUMN "billingEmail" TEXT;
ALTER TABLE "clients" ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL';
ALTER TABLE "clients" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "clients" ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3);
ALTER TABLE "clients" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "clients" ADD COLUMN "stripeSubscriptionId" TEXT;
