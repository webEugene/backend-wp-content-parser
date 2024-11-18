import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Analytics } from '../schemas/Analytics.schemas';
import { Model } from 'mongoose';
import { UpdateAnalyticDto } from './dto/update-analytic.dto';

@Injectable()
export class StaticAnalyticsService {
  constructor(
    @InjectModel(Analytics.name) private analyticsModel: Model<Analytics>,
  ) {}

  async createAnalytic(updateAnalyticDto: { tries: number; hostname: string }) {
    const newHost = new this.analyticsModel(updateAnalyticDto);
    return newHost.save();
  }

  async findHostname(hostname) {
    const findHostname = await this.analyticsModel.findOne({
      hostname: hostname,
    });
    if (!findHostname)
      throw new HttpException('Hostname is not found', HttpStatus.NOT_FOUND);

    return findHostname;
  }

  async updateAnalytic(updateAnalyticDto: UpdateAnalyticDto) {
    const findHostname = await this.analyticsModel.findOne({
      hostname: updateAnalyticDto.hostname,
    });

    return this.analyticsModel.findByIdAndUpdate(
      findHostname._id.toHexString(),
      {
        hostname: findHostname.hostname,
        tries: findHostname.tries + 1,
      },
      { new: true },
    );
  }
}
