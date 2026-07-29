/**
 * Sakani Platform Abstraction — FileSystem Service Placeholder
 */

export interface IFileSystemService {
  readFile?(path: string): Promise<string | null>;
  writeFile?(path: string, content: string): Promise<boolean>;
  deleteFile?(path: string): Promise<boolean>;
}

export const fileSystemService: IFileSystemService = {};
