import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Analytics } from '../schemas/analytics.schemas';
import { Model } from 'mongoose';
import { UpdateAnalyticDto } from './dto/update-analytic.dto';
import { UrlHostDto } from '../urls/dto/url-host.dto';
import { CreateAnalyticDto } from './dto/create-analytic-dto';

@Injectable()
export class StaticAnalyticsService {
  constructor(
    @InjectModel(Analytics.name) private analyticsModel: Model<Analytics>,
  ) {}

  async createAnalytic(createAnalyticDto: CreateAnalyticDto) {
    const newHost = new this.analyticsModel(createAnalyticDto);
    return newHost.save();
  }

  async findHostname(urlHostDto: UrlHostDto) {
    return this.analyticsModel.findOne({
      website: urlHostDto.url,
      host: urlHostDto.host,
    });
  }

  async updateAnalytic(updateAnalyticDto: UpdateAnalyticDto) {
    const findHostname = await this.analyticsModel.findOne({
      website: updateAnalyticDto.website,
      host: updateAnalyticDto.host,
    });

    return this.analyticsModel.findByIdAndUpdate(
      {
        _id: findHostname._id.toHexString(),
      },
      {
        $set: {
          tries: findHostname.tries + 1,
          wpDetect: updateAnalyticDto.wpDetect,
        },
      },
    );
  }

  async getAnalytics() {
    return this.analyticsModel.find();
  }
}
