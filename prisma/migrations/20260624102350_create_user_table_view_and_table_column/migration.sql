-- CreateTable
CREATE TABLE "UserTableView" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTableView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableColumn" (
    "id" SERIAL NOT NULL,
    "tableViewId" INTEGER NOT NULL,
    "field" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TableColumn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTableView_userId_moduleId_name_key" ON "UserTableView"("userId", "moduleId", "name");

-- CreateIndex
CREATE INDEX "TableColumn_tableViewId_idx" ON "TableColumn"("tableViewId");

-- AddForeignKey
ALTER TABLE "UserTableView" ADD CONSTRAINT "UserTableView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTableView" ADD CONSTRAINT "UserTableView_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableColumn" ADD CONSTRAINT "TableColumn_tableViewId_fkey" FOREIGN KEY ("tableViewId") REFERENCES "UserTableView"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
