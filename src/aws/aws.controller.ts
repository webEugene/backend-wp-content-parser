import { Controller, Delete, Get, Post } from '@nestjs/common';
import { AwsService } from './aws.service';
import { SITEMAP_URLS_DIR } from '../common/constants';

@Controller('aws')
export class AwsController {
  constructor(private readonly awsService: AwsService) {}

  @Post('csv')
  // @UseInterceptors(FileInterceptor('file')) // file must come in form-data
  // async uploadCsv(@UploadedFile() file: Express.Multer.File) {
  async uploadCsv() {
    // save to "reports" folder in S3
    // return this.awsService.uploadFile();
  }
  @Get('file-url')
  async getFileUrl() {
    // save to "reports" folder in S3
    return this.awsService.getFileUrl(
      `${SITEMAP_URLS_DIR}/miceleader_sitemap_url.json`,
    );
  }

  @Delete('delete-url')
  async deleteFileUrl() {
    // save to "reports" folder in S3
    return this.awsService.deleteFile(
      `${SITEMAP_URLS_DIR}/miceleader_sitemap_url.json`,
    );
  }
}
