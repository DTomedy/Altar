import 'server-only';
import { v2 as cloudinary } from 'cloudinary';
import { IStorageService } from './interfaces';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export class StorageService implements IStorageService {
  async uploadPublicImage(base64Data: string, folder: string = 'campaigns'): Promise<string> {
    try {
      const uploadResponse = await cloudinary.uploader.upload(base64Data, {
        folder: `altar/${folder}`,
        resource_type: 'image',
      });
      return uploadResponse.secure_url;
    } catch (error) {
      console.error('Cloudinary public upload failed:', error);
      throw new Error('Image upload failed');
    }
  }

  async uploadPrivateFile(base64Data: string, folder: string = 'kyc'): Promise<string> {
    try {
      const uploadResponse = await cloudinary.uploader.upload(base64Data, {
        folder: `altar/${folder}`,
        type: 'authenticated',
        access_mode: 'authenticated',
        resource_type: 'auto',
      });
      return uploadResponse.public_id;
    } catch (error) {
      console.error('Cloudinary private upload failed:', error);
      throw new Error('File upload failed');
    }
  }

  getSignedUrl(publicId: string, expiresInSeconds: number = 3600): string {
    try {
      return cloudinary.url(publicId, {
        sign_url: true,
        type: 'authenticated',
        secure: true,
        expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
      });
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      throw new Error('Failed to access file');
    }
  }
}
