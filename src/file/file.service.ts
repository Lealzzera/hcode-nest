import { Injectable } from '@nestjs/common';
import { writeFile } from 'fs';

@Injectable()
export class FileService {
  async upload(file: Express.Multer.File, path: string) {
    return writeFile(path, file.buffer, (err) => err);
  }

  async uploadMultipleFiles(files: Express.Multer.File[], path: string) {
    const filesUploaded = files.map(async (file) => {
      writeFile(`${path}/${file.originalname}`, file.buffer, (err) => err);
      return file.buffer;
    });
    return filesUploaded;
  }
}
