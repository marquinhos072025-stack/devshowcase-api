/*
  Warnings:

  - Added the required column `rating` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "rating" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "upvotes" INTEGER NOT NULL DEFAULT 0;
