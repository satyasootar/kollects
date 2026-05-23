import { AuthService } from "@repo/services/auth";
import UserService from "@repo/services/user";

// Service singletons — instantiated once, shared across all requests
export const authService = new AuthService();
export const userService = new UserService();
