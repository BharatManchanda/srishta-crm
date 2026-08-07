import { FieldType, PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import { LEAD_MODULE_ID } from "./module.seeder";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({adapter});
const fields = [
    {
        createdById: 1,
        moduleId: LEAD_MODULE_ID,
        name: "name",
        label: "Name",
        type: FieldType.TEXT,
        required: true,
        searchable: true,
    },
];