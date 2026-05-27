import { db } from "@repo/database";
import { usersTable } from "@repo/database/schema";
import { eq } from "drizzle-orm";
import { env } from "../env";
import { googleOAuth2Client } from "../clients/google-oauth";
import { GetAuthenticationMethodOutputSchema } from "./model";

class UserService {
  public async getAuthenticationMethods(): Promise<
    ReadonlyArray<GetAuthenticationMethodOutputSchema>
  > {
    const supportedAuthenticationProviders: GetAuthenticationMethodOutputSchema[] = [];

    const isGoogleConfigured = !!(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);

    if (isGoogleConfigured) {
      const url = googleOAuth2Client.generateAuthUrl();
      supportedAuthenticationProviders.push({
        provider: "GOOGLE_OAUTH",
        displayName: "Google",
        displayText: "Signin with Google",
        authUrl: url,
      });
    }

    return supportedAuthenticationProviders;
  }
  public async updateProfile(
    userId: string,
    data: { name?: string; avatarUrl?: string },
  ) {
    if (!data.name && data.avatarUrl === undefined) {
      return null;
    }

    const [updatedUser] = await db
      .update(usersTable)
      .set({
        ...(data.name ? { name: data.name } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      })
      .where(eq(usersTable.id, userId))
      .returning();

    return updatedUser;
  }
}

export default UserService;
