import { toast as sonner, type ExternalToast } from "sonner";

/**
 * Typed toast wrapper. All callers must import from here, never directly from `sonner`.
 * Tint styling is handled by the Toaster classNames config in ~/components/ui/sonner.tsx.
 */
export const toast = {
  success: (msg: string, opts?: ExternalToast) => sonner.success(msg, opts),
  info: (msg: string, opts?: ExternalToast) => sonner.info(msg, opts),
  warning: (msg: string, opts?: ExternalToast) => sonner.warning(msg, opts),
  error: (msg: string, opts?: ExternalToast) => sonner.error(msg, opts),
};
