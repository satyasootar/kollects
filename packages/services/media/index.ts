import ImageKit from "imagekit";
import { env } from "../env";
import { TRPCError } from "@trpc/server";

export class MediaService {
  private imagekit: ImageKit | null = null;

  constructor() {
    if (env.IMAGEKIT_PUBLIC_KEY && env.IMAGEKIT_PRIVATE_KEY && env.IMAGEKIT_URL_ENDPOINT) {
      this.imagekit = new ImageKit({
        publicKey: env.IMAGEKIT_PUBLIC_KEY,
        privateKey: env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
      });
    } else {
      console.warn("⚠️ ImageKit is not fully configured in environment variables.");
    }
  }

  /**
   * Retrieves authentication parameters required for direct frontend uploads to ImageKit.
   * This is highly secure and prevents binary file streams from traversing our backend.
   */
  getAuthenticationParameters() {
    if (!this.imagekit) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "ImageKit configuration is missing in the backend environment variables.",
      });
    }

    return this.imagekit.getAuthenticationParameters();
  }

  /**
   * Used for backend deletions (e.g. when a form is deleted, cleanup images)
   */
  async deleteFile(fileId: string) {
    if (!this.imagekit) return;
    
    try {
      await this.imagekit.deleteFile(fileId);
    } catch (error) {
      console.error(`Failed to delete ImageKit file ${fileId}:`, error);
    }
  }

  /**
   * Uploads a file buffer directly from the backend to ImageKit.
   */
  async uploadFile(file: Buffer | string, fileName: string): Promise<{ url: string, fileId: string, name: string, size: number }> {
    if (!this.imagekit) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "ImageKit configuration is missing.",
      });
    }

    try {
      const response = await this.imagekit.upload({
        file,
        fileName,
      });
      return {
        url: response.url,
        fileId: response.fileId,
        name: response.name,
        size: response.size,
      };
    } catch (error) {
      console.error(`Failed to upload to ImageKit:`, error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload file to ImageKit.",
      });
    }
  }
}
