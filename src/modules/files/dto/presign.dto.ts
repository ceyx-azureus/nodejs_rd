import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FileEntityType, FileVisibility } from '../file-record.entity';

const SUPPORTED_MIME_TYPES = /^(image\/(jpeg|png|webp)|application\/pdf)$/;

export class PresignDto {
  @IsEnum(FileEntityType)
  entityType: FileEntityType;

  @IsUUID()
  entityId: string;

  @IsString()
  originalName: string;

  @IsString()
  @Matches(SUPPORTED_MIME_TYPES, {
    message:
      'contentType must be one of: image/jpeg, image/png, image/webp, application/pdf',
  })
  contentType: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  size: number;

  @IsOptional()
  @IsEnum(FileVisibility)
  visibility?: FileVisibility;
}
