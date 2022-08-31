import { forwardRef, Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MulterModule } from '@nestjs/platform-express';
import { multerStorage } from '../common/utils/multer-storage';
import { FileManagement } from '../common/utils/file-management/file-management';
import { TravelModule } from '../travel/travel.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    forwardRef(() => TravelModule),
    forwardRef(() => UserModule),
    MulterModule.register({
      storage: multerStorage(FileManagement.storageDir('tmp')),
    }),
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
