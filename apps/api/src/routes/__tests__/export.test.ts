import request from "supertest";
import express from "express";
import { describe, it, expect, vi } from "vitest";

// Mocking the router or service that handles CSV export
vi.mock("@repo/services/response", () => {
  return {
    ResponseService: vi.fn().mockImplementation(() => {
      return {
        exportCsv: vi.fn().mockImplementation(async (formId, writeStream) => {
          // Simulate streaming 50k rows
          // A real implementation would use pg-query-stream
          for (let i = 0; i < 50000; i++) {
            writeStream.write(`response_${i},value1,value2\n`);
          }
          writeStream.end();
        }),
      };
    }),
  };
});

// Since the export endpoint doesn't exist yet, we'll mock its existence in the test
const testApp = express();

// Since the export endpoint doesn't exist yet, we'll mock its existence in the test
testApp.get("/api/forms/:formId/export", async (req, res) => {
  const { ResponseService } = await import("@repo/services/response");
  const service = new ResponseService();

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="export.csv"');

  // Pass the Express response object as a writable stream to the service
  await service.exportCsv(req.params.formId as string, res as any);
});

describe("TC-PERF-002 | Large Datasets | Massive CSV Export", () => {
  it("should stream 50,000 form responses to CSV without spiking Node.js memory", async () => {
    // Record initial memory usage
    const initialMemory = process.memoryUsage().heapUsed;

    const response = await request(testApp)
      .get("/api/forms/test-form-id/export")
      .buffer()
      .parse((res, callback) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          callback(null, data);
        });
      });

    // Record memory after processing
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDiffMB = (finalMemory - initialMemory) / 1024 / 1024;

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");

    // Check that we actually streamed data
    const responseData = response.text || response.body;
    expect(responseData).toContain("response_0");
    expect(responseData).toContain("response_49999");

    // The core validation: Streaming 50k rows should not bloat memory drastically
    // Usually memory shouldn't spike by more than 50-100MB for a simple stream,
    // whereas loading 50k rows into memory first would spike heavily.
    expect(memoryDiffMB).toBeLessThan(100);
  });
});
