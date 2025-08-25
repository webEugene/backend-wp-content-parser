import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SITEMAP_URLS_DIR } from '../common/constants';
import { Buffer } from 'node:buffer';


@Injectable()
export class AwsService {
  private readonly client: S3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });

  async uploadCsvFile() {
    const key = `${SITEMAP_URLS_DIR}/miceleader_sitemap_url.json`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: Buffer.from(key, 'utf8'),
      ContentType: 'text/csv',
    });

    await this.client.send(command);

    return {
      key,
      url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`,
    };
  }
}
