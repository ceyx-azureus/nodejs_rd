import { UserRole } from '../../users/user.entity';

export enum Resource {
  PRODUCT = 'product',
  ORDER = 'order',
  USER = 'user',
  FILE = 'file',
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

export type Permission = `${Resource}:${Action}`;

export interface PermissionContext {
  role: UserRole;
  scopes: string[];
}

export const ROLE_SCOPES: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    `${Resource.PRODUCT}:${Action.MANAGE}`,
    `${Resource.ORDER}:${Action.MANAGE}`,
    `${Resource.USER}:${Action.MANAGE}`,
    `${Resource.FILE}:${Action.MANAGE}`,
  ],
  [UserRole.USER]: [
    `${Resource.PRODUCT}:${Action.READ}`,
    `${Resource.ORDER}:${Action.CREATE}`,
    `${Resource.ORDER}:${Action.READ}`,
    `${Resource.USER}:${Action.READ}`,
    `${Resource.FILE}:${Action.CREATE}`,
    `${Resource.FILE}:${Action.READ}`,
  ],
};
