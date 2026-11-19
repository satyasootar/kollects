import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import config from "./config.js";
import { User } from "../modules/user/user.model.js";
import { Session } from "../modules/session/session.model.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const emailVerified = (profile.emails?.[0] as { verified?: boolean | string } | undefined)?.verified;

        if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
        }
        // Only a Google-verified address may be matched to (or create) a Kollects account.
        if (emailVerified !== true && emailVerified !== "true") {
            return done(null, false);
        }

        // Check if user already exists
        let user = await User.findOne({ 
            $or: [
                { googleId: profile.id },
                { email: email }
            ]
        }).select("+passwordHash");

        if (user) {
          // If user exists but doesn't have a googleId, link it
          if (!user.googleId) {
            // Nobody ever proved they own this inbox, so the password may have been set by someone
            // who pre-registered the address. Drop it and end its sessions; Google is the real owner.
            if (!user.isEmailVerified) {
              user.passwordHash = undefined;
              await Session.deleteMany({ userId: user._id });
            }
            user.googleId = profile.id;
            
            const avatarUrl = profile.photos?.[0]?.value;
            if (avatarUrl) {
                user.avatarUrl = avatarUrl;
            }
            
            user.isEmailVerified = true; 
            await user.save();
          }
          return done(null, user);
        }

        // Create user object safely for Mongoose
        const userData: any = {
          name: profile.displayName,
          email: email,
          googleId: profile.id,
          isEmailVerified: true,
        };

        const avatarUrl = profile.photos?.[0]?.value;
        if (avatarUrl) {
            userData.avatarUrl = avatarUrl;
        }

        user = await User.create(userData);
        // Read by googleAuthCallback to tell the client this was a sign-up.
        user.$locals.isNew = true;

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
