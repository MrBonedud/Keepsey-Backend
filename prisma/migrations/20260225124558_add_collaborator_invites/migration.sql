-- CreateEnum
CREATE TYPE "CollaboratorInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "CollaboratorInvite" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "invitedId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'EDITOR',
    "token" TEXT NOT NULL,
    "status" "CollaboratorInviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),

    CONSTRAINT "CollaboratorInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollaboratorInvite_token_key" ON "CollaboratorInvite"("token");

-- CreateIndex
CREATE INDEX "CollaboratorInvite_listId_idx" ON "CollaboratorInvite"("listId");

-- CreateIndex
CREATE INDEX "CollaboratorInvite_invitedId_idx" ON "CollaboratorInvite"("invitedId");

-- CreateIndex
CREATE INDEX "CollaboratorInvite_invitedById_idx" ON "CollaboratorInvite"("invitedById");

-- CreateIndex
CREATE UNIQUE INDEX "CollaboratorInvite_listId_invitedId_status_key" ON "CollaboratorInvite"("listId", "invitedId", "status");

-- AddForeignKey
ALTER TABLE "CollaboratorInvite" ADD CONSTRAINT "CollaboratorInvite_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorInvite" ADD CONSTRAINT "CollaboratorInvite_invitedId_fkey" FOREIGN KEY ("invitedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorInvite" ADD CONSTRAINT "CollaboratorInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
