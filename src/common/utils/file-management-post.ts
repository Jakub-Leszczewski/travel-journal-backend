import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { Express } from 'express';
import { FileManagement } from './file-management';

export class FileManagementPost extends FileManagement {
  static async savePostPhoto(
    userId: string,
    travelId: string,
    file: Express.Multer.File,
  ) {
    const postDir = this.getPostDirPath(userId, travelId);

    await this.createPostDir(userId, travelId);
    await this.moveFile(file.path, `${join(postDir, file.filename)}`);
  }

  static async removePostPhoto(
    userId: string,
    travelId: string,
    photoName: string,
  ) {
    const filePath = join(this.getPostDirPath(userId, travelId), photoName);

    try {
      await rm(filePath);
    } catch (e) {
      console.error(e);
    }
  }

  static getPostPhoto(userId: string, travelId: string, photoName: string) {
    return join(this.getPostDirPath(userId, travelId), photoName);
  }

  static getPostDirPath(userId: string, travelId: string) {
    const target = join('/user', userId, travelId);
    return this.storageDir(target);
  }

  static async createPostDir(userId: string, travelId: string) {
    try {
      const target = join('/user', userId, travelId);
      const userDir = this.storageDir(target);
      await mkdir(userDir, { recursive: true });
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }
}
