-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "allowedUserTypes" "UserType"[] DEFAULT ARRAY[]::"UserType"[];
