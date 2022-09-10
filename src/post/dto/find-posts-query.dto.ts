import { findPostsQueryDtoInterface } from '../../types';
import { IsInt, IsOptional, Min } from 'class-validator';

export class findTravelsQueryDto implements findPostsQueryDtoInterface {
  @IsInt()
  @Min(1)
  @IsOptional()
  public page: number = 1;
}
