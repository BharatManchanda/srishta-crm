import { BadRequestException, ForbiddenException, Get, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleEnum, ModuleFieldCreateDto } from './dto/module-field-create.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { ModuleFieldFilterBuilder } from './module-field-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { get } from 'http';
import { FieldType, Prisma } from '@prisma/client';
import { camelCaseToTitle, getEnumValue } from 'src/common/helpers/string.helper';

@Injectable()
export class ModuleFieldService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
        private readonly moduleFieldFilterBuilder: ModuleFieldFilterBuilder,
        private readonly userHierarchyService: UserHierarchyService,
    ) {}

   async getList(dto: any, currentUserId:number){
        const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id:'desc' };
        const user = await this.userHierarchyService.getMainParent(currentUserId);
        if (!user) {
            throw new ForbiddenException('User not found');
        }
        const result = await this.paginationService.paginate(this.prisma.moduleField, {
            paginate: false,
            where:{
                ...this.moduleFieldFilterBuilder.build(dto),
                createdById: user.id,
            },
            orderBy,
            include:{
                module:{
                    select: {
                        id:true,
                        name:true,
                    }
                },
                createdBy:{
                    select:{
                        id:true,
                        name:true,
                    }
                }
            }
        });
        return result;
    }

    async create(dto: ModuleFieldCreateDto, authUserId: number) {
        return await this.prisma.moduleField.create({
            data: {
                ...dto,
                createdById: authUserId
            }
        });
    }

    async update(dto: any, moduleId: number, authUserId: number) {
        const user = await this.userHierarchyService.getMainParent(authUserId);
        if (!user) {
            throw new ForbiddenException('User not found');
        }

        const createdById = user.id;

        for (const key of Object.keys(dto)) {
            await this.prisma.moduleField.updateMany({
                where: {
                    moduleId,
                    name: key,
                    createdById: createdById,
                },
                data: {
                    required: dto[key].required,
                },
            });
        }

        return true;
    }

    async createDefault(moduleId: number, module: ModuleEnum, authUserId: number) {
        const user = await this.userHierarchyService.getMainParent(authUserId);
        if (!user) {
            throw new ForbiddenException('User not found');
        }
        const createdById = user.id;

        this.getModuleFields(module).forEach(async (field) => {
            const moduleField = await this.prisma.moduleField.upsert({
                where: {
                    moduleId_name_createdById: {
                        moduleId: moduleId,
                        name: field.name,
                        createdById: createdById
                    },
                },

                update: {
                    
                },

                create: {
                    createdById: createdById,
                    moduleId: moduleId,
                    name: field.name,
                    label: camelCaseToTitle(field.name),
                    type: getEnumValue(FieldType,field.type, FieldType.TEXT),
                    options: [],
                    required: ["name", "email", "accountName", "subject", "title"].includes(field.name),
                    canEdit: ["name", "email", "accountName", "subject", "title"].includes(field.name),
                },
            });
        })
    }



    getModuleFields(module: ModuleEnum) {
        const moduleModelMap = {
            [ModuleEnum.LEAD]: "Lead",
            [ModuleEnum.CONTACT]: "Contact",
            [ModuleEnum.ACCOUNT]: "Account",
            [ModuleEnum.CALL]: "Call",
            [ModuleEnum.MEETING]: "Meeting",
            [ModuleEnum.NOTE]: "Note",
            [ModuleEnum.TASK]: "Task",
            [ModuleEnum.DEAL]: "Deal",
        };

        const modelName = moduleModelMap[module];

        if (!modelName) {
            return [];
        }

        const model = Prisma.dmmf.datamodel.models.find((model) => model.name === modelName);

        if (!model) {
            return [];
        }

        const fields = model.fields.map((field) => ({
            name: field.name,
            type: field.type,
            kind: field.kind,
            required: field.isRequired,
        }));

        const addressModules = {
            [ModuleEnum.CONTACT]: ["mailingAddress", "otherAddress"],
            [ModuleEnum.ACCOUNT]: ["billingAddress", "shippingAddress"],
        };

        const addressTypes = addressModules[module];

        if (addressTypes) {
            const addressModel = Prisma.dmmf.datamodel.models.find((model) => model.name === "Address");

            if (addressModel) {
                const addressFields = addressModel.fields
                    .filter((field) => field.name !== "id")
                    .filter((field) => field.kind === "scalar")
                    .map((field) => ({
                        name: field.name,
                        type: field.type,
                        kind: field.kind,
                        required: false,
                    }));

                addressTypes.forEach((addressType) => {
                    fields.push(
                        ...addressFields.map((field) => ({
                            ...field,
                            name: `${addressType}.${field.name}`,
                        }))
                    );
                });
            }
        }

        return fields;
    }

    // async validateRequiredFields(
    //     moduleId: number,
    //     userId: number,
    //     data: Record<string, any>,
    // ): Promise<void> {
    //     const fields = await this.prisma.moduleField.findMany({
    //         where: {
    //             moduleId,
    //             createdById: userId,
    //             required: true,
    //         },
    //         select: {
    //             name: true,
    //             label: true,
    //         },
    //     });

    //     const errors: Record<string, string> = {};

    //     for (const field of fields) {
    //         const value = data[field.name];

    //         if (
    //             value === undefined ||
    //             value === null ||
    //             (typeof value === 'string' && value.trim() === '')
    //         ) {
    //             errors[field.name] = `${field.label} is required`;
    //         }
    //     }

    //     if (Object.keys(errors).length > 0) {
    //         throw new BadRequestException({ message: 'Validation failed', errors });
    //     }
    // }

    async validateRequiredFields(
        moduleId: number,
        userId: number,
        data: Record<string, any>,
        existingData?: Record<string, any>,
    ): Promise<void> {
        const user = await this.userHierarchyService.getMainParent(userId);
        if (!user) {
            throw new ForbiddenException('User not found');
        }

        const createdById = user.id;

        const fields = await this.prisma.moduleField.findMany({
            where: {
                moduleId,
                createdById: createdById,
                required: true,
            },
            select: {
                name: true,
                label: true,
            },
        });

        const errors: Record<string, string> = {};

        for (const field of fields) {
            const value = data[field.name] !== undefined ? data[field.name] : existingData?.[field.name];

            if ( value === undefined || value === null || (typeof value === "string" && value.trim() === "") ) {
                errors[field.name] = `${field.label} is required`;
            }
        }

        if (Object.keys(errors).length > 0) {
            throw new BadRequestException({ message: "Validation failed", errors });
        }
    }
}
