import { mkdir, rm } from 'fs/promises';
import { Express } from 'express';
import { join } from 'path';
import { storageDir } from './storage-dir';
import { FileManagement } from './file-management';

export class FileManagementUser extends FileManagement {
  static async removeUserDir(userId: string) {
    const filePath = this.getUserDirPath(userId);
    try {
      await rm(filePath, { recursive: true });
    } catch (e) {
      console.error(e);
    }
  }

  static async saveUserPhoto(userId: string, file: Express.Multer.File) {
    const userDir = this.getUserDirPath(userId);

    await this.createUserDir(userId);
    await this.moveFile(file.path, `${join(userDir, file.filename)}`);
  }

  static async userPhotoRemove(userId: string, avatarName: string) {
    const filePath = join(this.getUserDirPath(userId), avatarName);
    try {
      await rm(filePath);
    } catch (e) {
      console.error(e);
    }
  }

  static userPhotoGet(userId: string, photoName: string) {
    return join(this.getUserDirPath(userId), photoName);
  }

  static getUserDirPath(userId: string) {
    const target = join('/user', userId);
    return storageDir(target);
  }

  static async createUserDir(userId: string) {
    try {
      const target = join('/user', userId);
      const userDir = storageDir(target);
      await mkdir(userDir, { recursive: true });
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }
}