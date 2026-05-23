import { Writable } from "stream";

export class ResponseService {
  /**
   * Export all responses for a given form to a CSV stream.
   * @param formId The ID of the form
   * @param stream The writable stream (e.g., an Express response object)
   */
  async exportCsv(formId: string, stream: Writable): Promise<void> {
    throw new Error("Not implemented");
  }
  
  /**
   * List responses for a given form
   * @param formId The ID of the form
   * @param page The page number for pagination
   * @param limit The number of items per page
   */
  async list(formId: string, page: number, limit: number): Promise<{ items: any[], total: number }> {
    throw new Error("Not implemented");
  }
}

export const responseService = new ResponseService();
