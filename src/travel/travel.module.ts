import { forwardRef, Module } from '@nestjs/common';
import { TravelService } from './travel.service';
import { TravelController } from './travel.controller';
import { MulterModule } from '@nestjs/platform-express';
import { multerStorage } from '../common/utils/multer-storage';
import { FileManagement } from '../common/utils/file-management/file-management';
import { PostModule } from '../post/post.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MulterModule.register({
      storage: multerStorage(FileManagement.storageDir('tmp')),
    }),
    forwardRef(() => PostModule),
    forwardRef(() => UserModule),
  ],
  controllers: [TravelController],
  providers: [TravelService],
  exports: [TravelService],
})
export class TravelModule {}
