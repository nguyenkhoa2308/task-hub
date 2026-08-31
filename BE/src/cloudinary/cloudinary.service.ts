import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(configService: ConfigService) {
    cloudinary.config({
      cloud_name: configService.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.getOrThrow<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  uploadBuffer(buffer: Buffer, options: UploadApiOptions): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error || !result) {
          reject(new InternalServerErrorException('Không thể tải tệp lên Cloudinary'));
          return;
        }
        resolve(result);
      });
      stream.end(buffer);
    });
  }

  createPrivateDownloadUrl(
    publicId: string,
    format: string,
    resourceType: 'image' | 'video' | 'raw',
  ) {
    return cloudinary.utils.private_download_url(publicId, format, {
      resource_type: resourceType,
      type: 'authenticated',
      attachment: true,
      expires_at: Math.floor(Date.now() / 1000) + 60,
    });
  }

  async deleteAsset(publicId: string, resourceType: 'image' | 'video' | 'raw', type: string) {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type });
  }
}
