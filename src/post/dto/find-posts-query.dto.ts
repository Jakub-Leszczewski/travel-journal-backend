import { FindPostsQueryDtoInterface } from '../../types';
import { IsInt, IsOptional, Min } from 'class-validator';

export class FindTravelsQueryDto implements FindPostsQueryDtoInterface {
  @IsInt()
  @Min(1)
  @IsOptional()
  public page: number = 1;
}
