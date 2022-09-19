import { forwardRef, Module } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { FriendshipController } from './friendship.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [FriendshipController],
  providers: [FriendshipService],
  exports: [FriendshipService],
})
export class FriendshipModule {}
