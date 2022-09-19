import { IsInt, IsOptional, Min } from 'class-validator';
import { FindIndexQueryDtoInterface } from '../../types';

export class FindIndexQueryDto implements FindIndexQueryDtoInterface {
  @IsInt()
  @Min(1)
  @IsOptional()
  public page: number = 1;
}
