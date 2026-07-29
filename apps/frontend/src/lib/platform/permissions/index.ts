/**
 * Sakani Platform Abstraction — Permissions Service Placeholder
 */

export interface IPermissionsService {
  requestPermission?(permission: "camera" | "location" | "notifications"): Promise<boolean>;
}

export const permissionsService: IPermissionsService = {};
