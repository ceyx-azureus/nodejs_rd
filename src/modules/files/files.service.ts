import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import {
  FileRecord,
  FileEntityType,
  FileStatus,
  FileVisibility,
} from './file-record.entity';
import { StorageService } from './storage.service';
import { PresignDto } from './dto/presign.dto';
import { User, UserRole } from '../users/user.entity';
import { Product } from '../products/product.entity';

export interface PresignResponse {
  fileId: string;
  key: string;
  uploadUrl: string;
  contentType: string;
}

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileRecord)
    private readonly fileRecordRepo: Repository<FileRecord>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly storageService: StorageService,
  ) {}

  async presign(
    dto: PresignDto,
    userId: string,
    userRole: string,
  ): Promise<PresignResponse> {
    try {
      await this.assertEntityAccess(
        dto.entityType,
        dto.entityId,
        userId,
        userRole,
      );
    } catch (error) {
      console.error('Entity access check failed:', error);
      throw error;
    }
    console.log('----- presign service', dto);
    const ext = extname(dto.originalName).toLowerCase() || '.bin';
    const uuid = randomUUID();
    const key = this.buildKey(dto.entityType, dto.entityId, uuid, ext);

    const uploadUrl = await this.storageService.createPresignedUploadUrl(
      key,
      dto.contentType,
    );

    const record = this.fileRecordRepo.create({
      ownerId: userId,
      entityId: dto.entityId,
      entityType: dto.entityType,
      key,
      originalName: dto.originalName,
      contentType: dto.contentType,
      size: dto.size,
      visibility: dto.visibility ?? FileVisibility.PRIVATE,
      status: FileStatus.PENDING,
    });

    await this.fileRecordRepo.save(record);

    return { fileId: record.id, key, uploadUrl, contentType: dto.contentType };
  }

  async complete(
    fileId: string,
    userId: string,
  ): Promise<{ fileId: string; status: string }> {
    const record = await this.fileRecordRepo.findOne({ where: { id: fileId } });

    if (!record) {
      throw new NotFoundException('File record not found');
    }

    if (record.ownerId !== userId) {
      throw new ForbiddenException('You do not own this file');
    }

    if (record.status !== FileStatus.PENDING) {
      throw new BadRequestException(
        `File is not in pending state (current: ${record.status})`,
      );
    }

    record.status = FileStatus.READY;
    await this.fileRecordRepo.save(record);

    await this.linkFileToEntity(record);

    return { fileId: record.id, status: record.status };
  }

  async getFileUrl(fileId: string, userId: string): Promise<{ url: string }> {
    const record = await this.fileRecordRepo.findOne({ where: { id: fileId } });

    if (!record) {
      throw new NotFoundException('File record not found');
    }

    if (
      record.visibility === FileVisibility.PRIVATE &&
      record.ownerId !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    if (record.status !== FileStatus.READY) {
      throw new BadRequestException('File is not ready yet');
    }

    const url = await this.storageService.createViewUrl(record.key);
    return { url };
  }

  private buildKey(
    entityType: FileEntityType,
    entityId: string,
    uuid: string,
    ext: string,
  ): string {
    const categoryMap: Record<FileEntityType, string> = {
      [FileEntityType.USER]: 'avatars',
      [FileEntityType.PRODUCT]: 'images',
      [FileEntityType.RECEIPT]: 'receipts',
    };
    const category = categoryMap[entityType];
    return `${entityType}s/${entityId}/${category}/${uuid}${ext}`;
  }

  private async assertEntityAccess(
    entityType: FileEntityType,
    entityId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const isAdmin = userRole === UserRole.ADMIN;

    if (entityType === FileEntityType.USER) {
      if (!isAdmin && entityId !== userId) {
        throw new ForbiddenException(
          'You can only upload files for your own user account',
        );
      }
      const exists = await this.userRepo.existsBy({ id: entityId });
      if (!exists) {
        throw new NotFoundException('User not found');
      }
    } else if (
      [FileEntityType.PRODUCT, FileEntityType.RECEIPT].includes(entityType)
    ) {
      if (!isAdmin) {
        throw new ForbiddenException(
          'Only admins can upload files for products and receipts',
        );
      }
      if (entityType === FileEntityType.PRODUCT) {
        const exists = await this.productRepo.existsBy({ id: entityId });
        if (!exists) {
          throw new NotFoundException('Product not found');
        }
      }
    }
  }

  private async linkFileToEntity(record: FileRecord): Promise<void> {
    if (record.entityType === FileEntityType.USER) {
      await this.userRepo.update(record.entityId, { avatarFileId: record.id });
    }
    if (record.entityType === FileEntityType.PRODUCT) {
      await this.productRepo.update(record.entityId, {
        imageFileId: record.id,
      });
    }
  }
}
