import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileRecord } from './file-record.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { StorageService } from './storage.service';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileRecord]),
    UsersModule,
    ProductsModule,
    AuthModule,
  ],
  controllers: [FilesController],
  providers: [FilesService, StorageService],
})
export class FilesModule {}
