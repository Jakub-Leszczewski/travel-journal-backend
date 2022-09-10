import { IsInt, IsOptional, Min } from 'class-validator';
import { findIndexQueryDtoInterface } from '../../types';

export class findIndexQueryDto implements findIndexQueryDtoInterface {
  @IsInt()
  @Min(1)
  @IsOptional()
  public page: number = 1;
}
