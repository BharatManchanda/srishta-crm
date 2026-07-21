import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentService {

    constructor(private prisma: PrismaService) {}

    async getLead(id: number) {
        return this.prisma.lead.findUnique({
            where: { id }
        });
    }

    buildDocument(lead: any): string {
        return `
            Lead Name: ${lead.firstName}
            Company: ${lead.company}
            Email: ${lead.email}
            Phone: ${lead.phone}
            Status: ${lead.status}
            Description: ${lead.description}
            Notes: ${lead.notes.map(n => n.content).join("\n")}
        `;
    }
}