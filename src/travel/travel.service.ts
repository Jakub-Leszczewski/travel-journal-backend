import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import {
  CreateTravelResponse,
  DeleteTravelResponse,
  GetTravelResponse,
  GetTravelsResponse,
  TravelSaveResponseData,
  UpdateTravelResponse,
} from '../types';
import { Travel } from './entities/travel.entity';
import { FileManagementTravel } from '../common/utils/file-management/file-management-travel';
import { config } from '../config/config';
import { createReadStream, ReadStream } from 'fs';
import { FileManagement } from '../common/utils/file-management/file-management';
import { FindTravelsQueryDto } from './dto/find-travels-query.dto';
import { UserService } from '../user/user.service';
import { FindOptionsWhere } from 'typeorm';

@Injectable()
export class TravelService {
  constructor(@Inject(forwardRef(() => UserService)) private userService: UserService) {}

  async getTravel(where: FindOptionsWhere<Travel>): Promise<Travel> {
    return Travel.findOne({
      where,
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<GetTravelResponse> {
    if (!id) throw new BadRequestException();

    const travel = await this.getTravel({ id });
    if (!travel) throw new NotFoundException();

    return this.filter(travel);
  }

  async findAllByUserId(id: string, { page }: FindTravelsQueryDto): Promise<GetTravelsResponse> {
    if (!id) throw new BadRequestException();

    const [travels, totalTravelsCount] = await Travel.findAndCount({
      where: { user: { id } },
      relations: ['user'],
      order: { startAt: 'DESC' },
      skip: config.itemsCountPerPage * (page - 1),
      take: config.itemsCountPerPage,
    });

    return {
      travels: travels.map((e) => this.filter(e)),
      totalPages: Math.ceil(totalTravelsCount / config.itemsCountPerPage),
      totalTravelsCount,
    };
  }

  async create(
    userId: string,
    createTravelDto: CreateTravelDto,
    file: Express.Multer.File,
  ): Promise<CreateTravelResponse> {
    try {
      if (!userId) throw new BadRequestException();

      const user = await this.userService.getUser({ id: userId });
      if (!user) throw new NotFoundException();

      if (new Date(createTravelDto.startAt).getTime() > new Date(createTravelDto.endAt).getTime()) {
        throw new BadRequestException();
      }

      const travel = new Travel();
      travel.title = createTravelDto.title;
      travel.description = createTravelDto.description;
      travel.destination = createTravelDto.destination;
      travel.comradesCount = createTravelDto.comradesCount;
      travel.startAt = new Date(createTravelDto.startAt);
      travel.endAt = new Date(createTravelDto.endAt);
      await travel.save();

      travel.user = user;
      await travel.save();

      if (file) {
        if (travel.photoFn) {
          await FileManagementTravel.removeTravelPhoto(user.id, travel.id, travel.photoFn);
        }

        const newFile = await FileManagementTravel.saveTravelPhoto(user.id, travel.id, file);
        await FileManagementTravel.removeFromTmp(file.filename);

        travel.photoFn = newFile.filename;
        await travel.save();
      }

      return this.filter(travel);
    } catch (e) {
      if (file) await FileManagementTravel.removeFromTmp(file.filename);
      throw e;
    }
  }

  async update(
    id: string,
    updateTravelDto: UpdateTravelDto,
    file: Express.Multer.File,
  ): Promise<UpdateTravelResponse> {
    try {
      if (!id) throw new BadRequestException();

      const travel = await this.getTravel({ id });
      if (!travel || !travel.user) throw new NotFoundException();

      travel.title = updateTravelDto.title ?? travel.title;
      travel.description = updateTravelDto.description ?? travel.description;
      travel.destination = updateTravelDto.destination ?? travel.destination;
      travel.comradesCount = updateTravelDto.comradesCount ?? travel.comradesCount;
      travel.startAt = updateTravelDto.startAt ? new Date(updateTravelDto.startAt) : travel.startAt;
      travel.endAt = updateTravelDto.endAt ? new Date(updateTravelDto.endAt) : travel.endAt;
      await travel.save();

      if (new Date(travel.startAt).getTime() > new Date(travel.endAt).getTime()) {
        throw new BadRequestException();
      }

      if (file) {
        if (travel.photoFn) {
          await FileManagementTravel.removeTravelPhoto(travel.user.id, travel.id, travel.photoFn);
        }

        const newFile = await FileManagementTravel.saveTravelPhoto(travel.user.id, travel.id, file);
        await FileManagementTravel.removeFromTmp(file.filename);

        travel.photoFn = newFile.filename;
        await travel.save();
      }

      return this.filter(travel);
    } catch (e) {
      if (file) await FileManagementTravel.removeFromTmp(file.filename);
      throw e;
    }
  }

  async remove(id: string): Promise<DeleteTravelResponse> {
    if (!id) throw new BadRequestException();

    const travel = await this.getTravel({ id });
    if (!travel || !travel.user) throw new NotFoundException();

    await FileManagementTravel.removeTravelDir(travel.user.id, id);
    await travel.remove();

    return this.filter(travel);
  }

  async getPhoto(id: string): Promise<ReadStream> {
    if (!id) throw new BadRequestException();

    const travel = await this.getTravel({ id });
    if (!travel) throw new NotFoundException();

    if (travel?.photoFn && travel.user) {
      const filePath = FileManagementTravel.getTravelPhoto(
        travel.user.id,
        travel.id,
        travel.photoFn,
      );
      return createReadStream(filePath);
    }

    return createReadStream(FileManagement.storageDir('no-image.png'));
  }

  async getCountByUserId(id: string): Promise<number> {
    if (!id) throw new BadRequestException();

    return Travel.count({
      where: { user: { id } },
    });
  }

  filter(travel: Travel): TravelSaveResponseData {
    const { photoFn, user, posts, ...travelResponse } = travel;

    return {
      ...travelResponse,
      photo: `/travel/photo/${travelResponse.id}`,
      authorId: user.id,
    };
  }
}
