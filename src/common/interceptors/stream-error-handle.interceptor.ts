import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response } from 'express';
import { ReadStream } from 'fs';

@Injectable()
export class StreamErrorHandleInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const res = context.switchToHttp().getResponse() as Response;

    return next.handle().pipe(
      map((data) => {
        if (data instanceof ReadStream) {
          data.on('error', (e) => {
            data.destroy();
            res.status(404).json(new NotFoundException().getResponse());
          });

          return new StreamableFile(data, { type: '' });
        }

        return data;
      }),
    );
  }
}
