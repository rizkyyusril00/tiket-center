/*
  Warnings:

  - A unique constraint covering the columns `[sortOrder]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Category_sortOrder_key" ON "Category"("sortOrder");
