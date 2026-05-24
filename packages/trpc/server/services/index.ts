import { AuthService } from "@repo/services/auth";
import UserService from "@repo/services/user";
import { FormService } from "@repo/services/form";
import { FieldService } from "@repo/services/field";
import { SlugService } from "@repo/services/slug";
import { MediaService } from "@repo/services/media";
import { SubmissionService } from "@repo/services/submission";
import { ResponseService } from "@repo/services/response";
import { AnalyticsService } from "@repo/services/analytics";
import { RateLimitService } from "@repo/services/rate-limit";
import { CacheService } from "@repo/services/cache";

// Service singletons — instantiated once, shared across all requests
export const authService = new AuthService();
export const userService = new UserService();
export const formService = new FormService();
export const fieldService = new FieldService();
export const slugService = new SlugService();
export const mediaService = new MediaService();
export const submissionService = new SubmissionService();
export const responseService = new ResponseService();
export const analyticsService = new AnalyticsService();
export const rateLimitService = new RateLimitService();
export const cacheService = new CacheService();
