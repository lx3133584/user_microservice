import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { __ as t } from 'i18n';

import { InfoGroup } from '../entities/info-group.entity';
import { InfoGroupService } from '../services/info-group.service';

@Controller()
export class InfoGroupGrpcController {
    constructor(
        @Inject(InfoGroupService) private readonly infoGroupService: InfoGroupService
    ) { }

    @GrpcMethod('InfoGroupService')
    async createInfoGroup(payload: { name: string, roleId: number }) {
        await this.infoGroupService.create(payload.name, payload.roleId);
        return { code: 200, message: t('Create a information group successfully') };
    }

    @GrpcMethod('InfoGroupService')
    async deleteInfoGroup(payload: { groupId: number }) {
        await this.infoGroupService.delete(payload.groupId);
        return { code: 200, message: t('Deleted the information group successfully') };
    }

    @GrpcMethod('InfoGroupService')
    async updateInfoGroup(payload: { groupId: number, name: string, roleId: number }) {
        await this.infoGroupService.update(payload.groupId, payload.name, payload.roleId);
        return { code: 200, message: t('Update the information group successfully') };
    }

    @GrpcMethod('InfoGroupService')
    async addInfoItemToInfoGroup(payload: { infoGroupId: number, infoItemIds: number[] }) {
        await this.infoGroupService.addInfoItem(payload.infoGroupId, payload.infoItemIds);
        return { code: 200, message: t('Add an information item to the information group successfully') };
    }

    @GrpcMethod('InfoGroupService')
    async deleteIntoItemFromInfoGroup(payload: { infoGroupId: number, infoItemIds: number[] }) {
        await this.infoGroupService.deleteIntoItem(payload.infoGroupId, payload.infoItemIds);
        return { code: 200, message: t('Delete the information item in the information group successfully') };
    }

    @GrpcMethod('InfoGroupService')
    async findAllInfoGroup(payload: { pageNumber: number, pageSize: number }) {
        const result = await this.infoGroupService.findAll(payload.pageNumber, payload.pageSize);
        let data: InfoGroup[];
        let count: number;
        if (typeof result[1] === 'number') {
            data = (result as [InfoGroup[], number])[0];
            count = (result as [InfoGroup[], number])[1];
        } else {
            data = result as InfoGroup[];
        }
        return { code: 200, message: t('Query all information groups successfully'), data, count };
    }

    @GrpcMethod('InfoGroupService')
    async findInfoItemsByGroupId(payload: { groupId: number }) {
        const data = await this.infoGroupService.findItemsById(payload.groupId);
        return { code: 200, message: t('Query the information item in the information group successfully'), data };
    }
}