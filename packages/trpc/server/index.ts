import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { formRouter } from "./routes/form/route";
import { fieldRouter } from "./routes/field/route";
import { mediaRouter } from "./routes/media/route";
import { publicFormRouter } from "./routes/public-form/route";
import { publicExploreRouter } from "./routes/public-explore/route";
import { publicSubmitRouter } from "./routes/public-submit/route";
import { responseRouter } from "./routes/response/route";
import { analyticsRouter } from "./routes/analytics/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  form: formRouter,
  field: fieldRouter,
  media: mediaRouter,
  publicForm: publicFormRouter,
  publicExplore: publicExploreRouter,
  publicSubmit: publicSubmitRouter,
  response: responseRouter,
  analytics: analyticsRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
