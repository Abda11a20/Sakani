/**
 * Sakani Platform Abstraction — Camera Service Placeholder
 */

export interface ICameraService {
  takePhoto?(): Promise<string | null>;
  pickImage?(): Promise<string | null>;
}

export const cameraService: ICameraService = {};
