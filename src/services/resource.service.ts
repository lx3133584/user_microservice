import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';

import { Permission } from '../entities/permission.entity';
import { Resource } from '../entities/resource.entity';
import { SystemModule } from '../entities/system-module.entity';

@Injectable()
export class ResourceService {
    constructor(
        @InjectRepository(SystemModule) private readonly systemModuleRepo: Repository<SystemModule>,
        @InjectRepository(Resource) private readonly resourceRepo: Repository<Resource>,
        @InjectRepository(Permission) private readonly permissionRepo: Repository<Permission>
    ) { }

    async saveResourcesAndPermissions(payload: string) {
        const metadataMap: Map<string, { name: string, resource: Resource[] }> = new Map();
        const obj = JSON.parse(payload);
        Object.keys(obj).forEach(k => metadataMap.set(k, obj[k]));

        // Sacnned modules
        const scannedModules = [...metadataMap.values()].map(v => ({ name: v.name }));

        // Delete removed module
        const notExistingModule = await this.systemModuleRepo.find({
            where: { name: Not(In(scannedModules.length ? scannedModules.map(v => v.name) : ['__delete_all_system_module__'])) }
        });
        if (notExistingModule.length) await this.systemModuleRepo.delete(notExistingModule.map(v => v.id));
        // Create new module
        const existingModules = await this.systemModuleRepo.find({ order: { id: 'ASC' } });
        const newModules = scannedModules.filter(sm => !existingModules.map(v => v.name).includes(sm.name));
        if (newModules.length) await this.systemModuleRepo.save(this.systemModuleRepo.create(newModules));
        // Update existing module
        if (existingModules.length) {
            existingModules.forEach(em => {
                em.name = scannedModules.find(sm => sm.name === em.name).name;
            });
            await this.systemModuleRepo.save(existingModules);
        }

        // Sacnned resources
        for (const [key, value] of metadataMap) {
            const resourceModule = await this.systemModuleRepo.findOne({ where: { name: value.name } });
            value.resource.forEach(resouece => {
                resouece.systemModule = resourceModule;
            });
        }
        const scannedResources: Resource[] = <Resource[]>[].concat(...[...metadataMap.values()].map(v => v.resource));

        // Delete removed resource
        const resourceIdentifies = scannedResources.length ? scannedResources.map(v => v.identify) : ['__delete_all_resource__'];
        const notExistResources = await this.resourceRepo.find({ where: { identify: Not(In(resourceIdentifies)) } });
        if (notExistResources.length > 0) await this.resourceRepo.delete(notExistResources.map(v => v.id));
        // Create new resource
        const existResources = await this.resourceRepo.find({ order: { id: 'ASC' } });
        const newResourcess = scannedResources.filter(sr => !existResources.map(v => v.identify).includes(sr.identify));
        if (newResourcess.length > 0) await this.resourceRepo.save(this.resourceRepo.create(newResourcess));
        // Update resource
        if (existResources.length) {
            existResources.forEach(er => {
                er.name = scannedResources.find(sr => sr.identify === er.identify).name;
            });
            await this.resourceRepo.save(existResources);
        }

        // Sacnned permissions
        const scannedPermissions = <Permission[]>[].concat(...scannedResources.map(metadataValue => {
            metadataValue.permissions.forEach(v => v.resource = metadataValue);
            return metadataValue.permissions;
        }));
        // Delete removed permission
        const resource = await this.resourceRepo.find({ where: { identify: In(scannedPermissions.map(v => v.resource.identify)) } });
        scannedPermissions.forEach(permission => {
            permission.resource = resource.find(v => v.identify === permission.resource.identify);
        });
        // Create removed permission
        const permissionIdentifies = scannedPermissions.length ? scannedPermissions.map(v => v.identify) : ['__delete_all_permission__'];
        const notExistPermissions = await this.permissionRepo.find({ where: { identify: Not(In(permissionIdentifies)) } });
        if (notExistPermissions.length > 0) await this.permissionRepo.delete(notExistPermissions.map(v => v.id));

        const existPermissions = await this.permissionRepo.find({ order: { id: 'ASC' } });
        const newPermissions = scannedPermissions.filter(sp => !existPermissions.map(v => v.identify).includes(sp.identify));
        if (newPermissions.length > 0) await this.permissionRepo.save(this.permissionRepo.create(newPermissions));
        // Update permission
        if (existPermissions.length) {
            existPermissions.forEach(ep => {
                ep.name = scannedPermissions.find(sp => sp.identify === ep.identify).name;
                ep.action = scannedPermissions.find(sp => sp.identify === ep.identify).action;
            });
            await this.permissionRepo.save(existPermissions);
        }
    }

    async findResources(systemModuleId: number, pageNumber?: number, pageSize?: number) {
        if (pageNumber && pageSize) {
            return this.resourceRepo.findAndCount({
                where: { systemModule: { id: systemModuleId } },
                relations: ['permissions'],
                skip: (pageNumber - 1) * pageSize,
                take: pageSize
            });
        }
        return this.resourceRepo.find({ where: { systemModule: { id: systemModuleId } }, relations: ['permissions'] });
    }
}