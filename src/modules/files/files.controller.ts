import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScopesGuard } from '../auth/guards/scopes.guard';
import { RequireScopes } from '../auth/decorators/scopes.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FilesService } from './files.service';
import { PresignDto } from './dto/presign.dto';
import { CompleteDto } from './dto/complete.dto';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  scopes: string[];
}

@Controller('files')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('presign')
  @RequireScopes('file:create')
  presign(@Body() dto: PresignDto, @CurrentUser() user: AuthUser) {
    return this.filesService.presign(dto, user.id, user.role);
  }

  @Post('complete')
  @RequireScopes('file:create')
  complete(@Body() dto: CompleteDto, @CurrentUser() user: AuthUser) {
    return this.filesService.complete(dto.fileId, user.id);
  }

  @Get(':id')
  @RequireScopes('file:read')
  async getFileUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.filesService.getFileUrl(id, user.id);
  }
}
