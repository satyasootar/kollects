import { z } from "zod";

export const zodUndefinedModel = z.object({}).optional().describe("undefined");
export { z };
