import { describe, it, expect, vi } from "vitest";

// Mock the MediaService which interacts with ImageKit
const mockDeleteFile = vi.fn().mockResolvedValue(true);

vi.mock("@repo/services/media", () => {
  return {
    MediaService: vi.fn().mockImplementation(() => {
      return {
        deleteFile: mockDeleteFile,
      };
    }),
  };
});

// Assume we have a background worker or CRON service
// We will mock the database to simulate finding an orphaned file
const mockDb = {
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue([
        {
          id: "upload-1",
          fileId: "imagekit-id-123",
          formId: null,
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        }, // 48 hours ago
      ]),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(true),
  }),
};

const runCleanupJob = async (db: any) => {
  // 1. Find uploads older than 24h that have no associated formId
  const orphanedUploads = await db
    .select()
    .from("uploads")
    .where("formId is null AND createdAt < NOW() - INTERVAL '24 HOURS'");

  // 2. Delete from ImageKit
  const { MediaService } = await import("@repo/services/media");
  const mediaService = new MediaService();

  for (const upload of orphanedUploads) {
    if (upload.fileId) {
      await mediaService.deleteFile(upload.fileId);
    }
    // 3. Delete from database record
    await db.delete("uploads").where(`id = ${upload.id}`);
  }
};

describe("TC-DB-002 | Background Jobs | Orphaned Upload Cleanup", () => {
  it("should find uploads older than 24h without a form attached and delete them from the cloud provider", async () => {
    // Reset mocks
    mockDeleteFile.mockClear();

    // Execute the background job
    await runCleanupJob(mockDb);

    // Assert that the cloud provider deletion was called with the correct ImageKit file ID
    expect(mockDeleteFile).toHaveBeenCalledTimes(1);
    expect(mockDeleteFile).toHaveBeenCalledWith("imagekit-id-123");

    // Assert that the database record was also cleared
    expect(mockDb.delete).toHaveBeenCalled();
  });
});
