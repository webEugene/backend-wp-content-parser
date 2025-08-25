import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AwsService } from './aws.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('aws')
export class AwsController {
  constructor(private readonly awsService: AwsService) {}

  @Post('csv')
  // @UseInterceptors(FileInterceptor('file')) // file must come in form-data
  // async uploadCsv(@UploadedFile() file: Express.Multer.File) {
  async uploadCsv() {
    // save to "reports" folder in S3
    return this.awsService.uploadCsvFile();
  }
}
