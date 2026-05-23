import { AuthService } from "@repo/services/auth";
import UserService from "@repo/services/user";
import { FormService } from "@repo/services/form";
import { FieldService } from "@repo/services/field";
import { SlugService } from "@repo/services/slug";

// Service singletons — instantiated once, shared across all requests
export const authService = new AuthService();
export const userService = new UserService();
export const formService = new FormService();
export const fieldService = new FieldService();
export const slugService = new SlugService();
