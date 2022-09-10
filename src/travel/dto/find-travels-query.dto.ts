import { FindTravelsQueryDtoInterface } from '../../types';
import { IsInt, IsOptional, Min } from 'class-validator';

export class FindTravelsQueryDto implements FindTravelsQueryDtoInterface {
  @IsInt()
  @Min(1)
  @IsOptional()
  public page: number = 1;
}
