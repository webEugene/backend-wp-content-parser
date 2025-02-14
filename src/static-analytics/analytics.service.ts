import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnalyticsWpDetect } from '../schemas/analytics-wp-detect.schemas';
import { Model } from 'mongoose';
import { UpdateAnalyticDto } from './dto/update-analytic.dto';
import { UrlHostDto } from '../urls/dto/url-host.dto';
import { CreateAnalyticDto } from './dto/create-analytic-dto';
import { AnalyticsSitemapTest } from '../schemas/analytics-sitemap-test.schemas';
import { CreateSitemapAnalyticDto } from './dto/create-sitemap-analytic.dto';
import { UpdateSitemapAnalyticDto } from './dto/update-sitemap-analytic.dto';
import { APIFeatures } from '../utils/api-features';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AnalyticsWpDetect.name)
    private analyticsWpDetectModel: Model<AnalyticsWpDetect>,
    @InjectModel(AnalyticsSitemapTest.name)
    private analyticsSitemapTestModel: Model<AnalyticsSitemapTest>,
  ) {}

  async createWpCheckAnalytic(createAnalyticDto: CreateAnalyticDto) {
    const newHost = new this.analyticsWpDetectModel(createAnalyticDto);
    return newHost.save();
  }

  async createSitemapTestAnalytic(
    createSitemapAnalyticDto: CreateSitemapAnalyticDto,
  ) {
    const newSitemapTest = new this.analyticsSitemapTestModel(
      createSitemapAnalyticDto,
    );
    return newSitemapTest.save();
  }

  async findHostname(urlHostDto: UrlHostDto) {
    return this.analyticsWpDetectModel.findOne({
      website: urlHostDto.url,
      host: urlHostDto.host,
    });
  }

  async findHostnameSitemap(urlHostDto: UrlHostDto) {
    return this.analyticsSitemapTestModel.findOne({
      website: urlHostDto.url,
      host: urlHostDto.host,
    });
  }

  async updateAnalytic(
    updateAnalyticDto: UpdateAnalyticDto,
  ): Promise<AnalyticsWpDetect> {
    const findHostname = await this.analyticsWpDetectModel.findOne({
      website: updateAnalyticDto.website,
      host: updateAnalyticDto.host,
    });

    return this.analyticsWpDetectModel.findByIdAndUpdate(
      {
        _id: findHostname._id.toHexString(),
      },
      {
        $inc: {
          tries: 1,
        },
        $set: {
          wpDetect: updateAnalyticDto.wpDetect,
        },
      },
    );
  }

  async updateSitemapTestAnalytic(
    updateSitemapAnalyticDto: UpdateSitemapAnalyticDto,
  ): Promise<AnalyticsSitemapTest> {
    const findHostname = await this.analyticsSitemapTestModel.findOne({
      website: updateSitemapAnalyticDto.website,
      host: updateSitemapAnalyticDto.host,
    });

    return this.analyticsSitemapTestModel.findByIdAndUpdate(
      {
        _id: findHostname._id.toHexString(),
      },
      {
        $inc: {
          tries: 1,
        },
        $set: {
          status: updateSitemapAnalyticDto.status,
        },
      },
    );
  }

  async getWpCheckAnalytics(query?: any): Promise<any> {
    const features = new APIFeatures(this.analyticsWpDetectModel.find(), query)
      .filter()
      .sorting()
      .limit()
      .pagination();

    return await features.mongooseQuery;
    // return this.analyticsWpDetectModel.find();
  }

  async getSitemapTestAnalytics(query?: any): Promise<any> {
    const features = new APIFeatures(
      this.analyticsSitemapTestModel.find(),
      query,
    )
      .filter()
      .sorting()
      .limit()
      .pagination();

    return await features.mongooseQuery;
    // return this.analyticsSitemapTestModel.find();
  }
}
