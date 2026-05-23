import request from "supertest";
import app from "../../server";
import { describe, it, expect, vi } from "vitest";

// Mock MediaService
vi.mock("@repo/services/media", () => {
  return {
    MediaService: vi.fn().mockImplementation(() => {
      return {
        uploadFile: vi.fn().mockResolvedValue({
          url: "https://ik.imagekit.io/test/test-image.jpg",
          fileId: "test-file-id",
          name: "test-image.jpg",
          size: 1024,
        }),
      };
    }),
  };
});

describe("Upload Route", () => {
  it("should return 400 if no file is provided", async () => {
    const response = await request(app).post("/api/upload");
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "No file provided");
  });

  it("should successfully upload a file and return metadata", async () => {
    const fileBuffer = Buffer.from("fake-image-content");
    
    const response = await request(app)
      .post("/api/upload")
      .attach("file", fileBuffer, "test-image.jpg");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("url", "https://ik.imagekit.io/test/test-image.jpg");
    expect(response.body).toHaveProperty("fileId", "test-file-id");
    expect(response.body).toHaveProperty("name", "test-image.jpg");
    expect(response.body).toHaveProperty("size", 1024);
  });
});
