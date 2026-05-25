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

import { emailSettingsRouter } from "./routes/email-settings/route";
import { themeRouter } from "./routes/theme/route";
import { templateRouter } from "./routes/template/route";
import { apiKeyRouter } from "./routes/api-key/route";

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
  emailSettings: emailSettingsRouter,
  theme: themeRouter,
  template: templateRouter,
  apiKey: apiKeyRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
