/*
  Warnings:

  - A unique constraint covering the columns `[shareCode]` on the table `List` will be added. If there are existing duplicate values, this will fail.
  - The required column `shareCode` was added to the `List` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('VIEWER', 'EDITOR');

-- AlterTable
ALTER TABLE "List" ADD COLUMN     "shareCode" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ListCollaborator" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListCollaborator_listId_userId_key" ON "ListCollaborator"("listId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "List_shareCode_key" ON "List"("shareCode");

-- AddForeignKey
ALTER TABLE "ListCollaborator" ADD CONSTRAINT "ListCollaborator_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListCollaborator" ADD CONSTRAINT "ListCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
