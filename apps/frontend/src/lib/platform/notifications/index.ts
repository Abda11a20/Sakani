/**
 * Sakani Platform Abstraction — Push Notifications Platform Placeholder
 */

export interface INotificationsPlatformService {
  requestNotificationPermission?(): Promise<boolean>;
}

export const notificationsPlatformService: INotificationsPlatformService = {};
