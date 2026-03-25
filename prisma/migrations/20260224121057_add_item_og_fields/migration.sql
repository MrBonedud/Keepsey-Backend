-- DropIndex
DROP INDEX "Category_name_key";

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "price" TEXT,
ADD COLUMN     "url" TEXT;
