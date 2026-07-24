import { Injectable } from '@nestjs/common';
import { ExportDto, ExportModule } from './dto/export.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LeadService } from '../lead/lead.service';
import { ContactService } from '../contact/contact.service';
import { UserService } from '../user/user.service';
import { AccountService } from '../account/account.service';
import { Prisma } from "@prisma/client";
@Injectable()
export class ExportService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly leadService: LeadService,
        private readonly contactService: ContactService,
        private readonly userService: UserService,
        private readonly accountService: AccountService,
    ) { }
    async export(dto: ExportDto, authUserId: number) {
        let res = {};

        switch (dto.entity) {
            case ExportModule.USER:
                res = await this.userService.getList({
                    paginate: false,
                }, authUserId);
                break;
            case ExportModule.LEAD:
                res = await this.leadService.getList({
                    paginate: false,
                }, authUserId);
                break;
            case ExportModule.CONTACT:
                res = await this.contactService.getList({
                    paginate: false,
                }, authUserId);
                break;
            case ExportModule.ACCOUNT:
                res = await this.accountService.getList({
                    paginate: false,
                }, authUserId);
                break;
        }

        return this.getExcelSheet(res, dto.entity)
    }

    async getExcelSheet(data: any, entity?: ExportModule) {

        const list = data?.data ?? [];

        if (!list.length) return "";

        // const flatList: Record<string, any>[] = list.map((row) => this.flatten(row));
        const flatList: Record<string, any>[] = list.map((row) => {
            const flat = this.flatten(row);

            if (entity === ExportModule.LEAD) {
                Object.keys(flat).forEach((key) => {
                    if (
                        key.startsWith("createdBy.") ||
                        key.startsWith("openActivities.")
                    ) {
                        delete flat[key];
                    }
                });
            }

            if (entity === ExportModule.CONTACT) {
                Object.keys(flat).forEach((key) => {
                    if (
                        key.startsWith("createdBy.") ||
                        key.startsWith("openActivities.")
                    ) {
                        delete flat[key];
                    }
                });
            }

            if (entity === ExportModule.ACCOUNT) {
                Object.keys(flat).forEach((key) => {
                    if (
                        key.startsWith("createdBy.") ||
                        key.startsWith("openActivities.")
                    ) {
                        delete flat[key];
                    }
                });
            }

            return flat;
        });

        const headers: string[] = [
            ...new Set(flatList.flatMap((row) => Object.keys(row))),
        ];

        const csvRows = [
            headers.join(","),
            ...flatList.map((row) =>
                headers
                    .map((field) => {
                        let value = row[field];

                        if (value === null || value === undefined) {
                            value = "";
                        }

                        const escaped = String(value).replace(/"/g, '""');

                        return /[",\n]/.test(escaped)
                            ? `"${escaped}"`
                            : escaped;
                    })
                    .join(",")
            ),
        ];

        return csvRows.join("\n");
    }

    private flatten(obj: Record<string, any>, prefix = ""): Record<string, any> {
        return Object.keys(obj).reduce<Record<string, any>>((acc, key) => {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (value instanceof Prisma.Decimal) {
                acc[newKey] = value.toString();
            } else if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
                Object.assign(acc, this.flatten(value, newKey));
            } else {
                acc[newKey] = value;
            }

            return acc;
        }, {});
    }
}