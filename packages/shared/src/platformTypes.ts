/** Global object key for apex platform super-users (not tenant-scoped). */
export const PLATFORM_SUPER_USERS_OBJECT_KEY = 'platform_super_users';

/** Public platform operator — separate from tenant `User`. */
export interface PlatformUser {
  id: string;
  email: string;
  name: string;
}

export interface StoredPlatformUser extends PlatformUser {
  passwordHash: string;
  createdAt: string;
}
