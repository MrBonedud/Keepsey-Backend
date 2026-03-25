/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "ownerId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_ownerId_name_key" ON "Category"("ownerId", "name");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
