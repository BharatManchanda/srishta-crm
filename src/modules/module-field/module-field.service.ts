import { ForbiddenException, Get, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleEnum, ModuleFieldCreateDto } from './dto/module-field-create.dto';
import { ModuleFieldUpdateDto } from './dto/module-field-update.dto';
import { ModuleFieldFilterDto } from './dto/module-field-filter.dto';
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

    async update(dto: ModuleFieldUpdateDto, authUserId: number) {
        const user = await this.userHierarchyService.getMainParent(authUserId);
        if (!user) {
            throw new ForbiddenException('User not found');
        }
        
        return await this.prisma.moduleField.update({
            where: {
                moduleId_name_createdById: {
                    moduleId: dto.moduleId,
                    name: dto.name,
                    createdById: user.id
                },
            },
            data: {
                ...dto,
            },
        });
    }

    async createDefault(moduleId: number, module: ModuleEnum, authUserId: number) {
        this.getModuleFields(module).forEach(async (field) => {
            const moduleField = await this.prisma.moduleField.upsert({
                where: {
                    moduleId_name_createdById: {
                        moduleId: moduleId,
                        name: field.name,
                        createdById: authUserId
                    },
                },

                update: {
                    // label: field.label,
                    // type: field.type,
                    // required: field.required,
                    // options: field.options,
                },

                create: {
                    createdById: authUserId,
                    moduleId: moduleId,
                    name: field.name,
                    label: camelCaseToTitle(field.name),
                    type: getEnumValue(FieldType,field.type, FieldType.TEXT),
                    required: field.required ?? false,
                    options: [],
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
        };

        const modelName = moduleModelMap[module];

        if (!modelName) {
            return [];
        }

        const model = Prisma.dmmf.datamodel.models.find(
            (model) => model.name === modelName
        );

        return model?.fields.map(field => ({
            name: field.name,
            type: field.type,
            kind: field.kind,
            required: field.isRequired,
        })) ?? [];
    }
}
