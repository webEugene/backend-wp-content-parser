import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Buffer } from 'node:buffer';

@Injectable()
export class AwsService {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY'),
      },
    });
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME');
  }

  async getFileUrl(key: string): Promise<{ url: string }> {
    return {
      url: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
    };
  }

  async uploadFile(
    key: string,
    contentType: string,
  ): Promise<{
    key: string;
    url: string;
  }> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `public/sitemap-urls/${key}`,
      Body: Buffer.from(key, 'utf8'),
      ContentType: contentType,
    });

    await this.s3.send(command);

    return {
      key,
      url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`,
    };
  }

  async uploadJSON(data: string[], folder: string, fileName: string) {
    const jsonBuffer = Buffer.from(JSON.stringify(data, null, 2), 'utf8');

    const savedFile = await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: `${folder}/${fileName}`,
        Body: jsonBuffer,
        ContentType: 'application/json',
      }),
    );

    if (savedFile['$metadata'].httpStatusCode !== 200) {
      return undefined;
    }

    return await this.getFileUrl(`${folder}/${fileName}`);
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3.send(command);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        `Error deleting file: ${err.message}`,
      );
    }
  }
}
