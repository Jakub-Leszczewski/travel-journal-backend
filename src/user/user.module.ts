import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MulterModule } from '@nestjs/platform-express';
import { multerStorage } from '../common/utils/multer-storage';
import { FileManagement } from '../common/utils/file-management/file-management';
import { TravelModule } from '../travel/travel.module';
import { PostModule } from '../post/post.module';
import { FriendshipModule } from '../friendship/friendship.module';
import { UserHelperService } from './user-helper.service';

@Module({
  imports: [
    MulterModule.register({
      storage: multerStorage(FileManagement.storageDir('tmp')),
    }),
    forwardRef(() => TravelModule),
    forwardRef(() => PostModule),
    forwardRef(() => FriendshipModule),
  ],
  controllers: [UserController],
  providers: [UserService, UserHelperService],
  exports: [UserService, UserHelperService],
})
export class UserModule {}
