import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/use-auth-store";
import { api } from "@/lib/api";
import type { ApiResponse, User } from "@/types";
import { track } from "@/lib/tracker";

export function AuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // The backend set the httpOnly auth cookies before redirecting here; load the profile with them.
        const response = await api.get<ApiResponse<User>>("/auth/me");
        setAuth(response.data.data);
        // Google sign-in and sign-up share this page; the server flags a just-created account.
        track(searchParams.get("new") === "1" ? "signup" : "login", { method: "google" });

        const redirect = searchParams.get("state");
        navigate(redirect || "/dashboard/overview", { replace: true });
      } catch (error) {
        console.error("Failed to sync auth state:", error);
        navigate("/auth/login", { replace: true });
      }
    };

    handleAuth();
  }, [searchParams, setAuth, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Finalizing authentication...</p>
      </div>
    </div>
  );
}
