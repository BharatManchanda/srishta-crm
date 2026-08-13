-- AlterTable
ALTER TABLE "User" ADD COLUMN     "annualRevenue" DECIMAL(15,2),
ADD COLUMN     "comapanyEmail" TEXT,
ADD COLUMN     "comapanyPhone" TEXT,
ADD COLUMN     "companyCity" TEXT,
ADD COLUMN     "companyCountry" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "companyPincode" INTEGER,
ADD COLUMN     "companyWebsite" TEXT,
ADD COLUMN     "employees" INTEGER,
ADD COLUMN     "industry" TEXT;
