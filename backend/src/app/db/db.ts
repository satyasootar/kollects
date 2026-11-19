import mongoose from "mongoose";
import config from "../../config/config.js";
import { Session } from "../../modules/session/session.model.js";

export const connectDB = async () => {
    try {
        if (!config.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in the environment variables.");
        }

        const connectionInstance = await mongoose.connect(config.MONGODB_URI);

        console.log(`\n MongoDB Connected! DB Host: ${connectionInstance.connection.host}`);

        // Sessions used to store the raw refresh token under a unique index. Drop those rows (their
        // tokens can't verify with the new secrets anyway) and the old index.
        // ponytail: runs every boot but is a no-op after the first; delete once all envs are migrated.
        await Session.deleteMany({ tokenHash: { $exists: false } });
        await Session.syncIndexes();
    } catch (error) {
        console.error("MongoDB connection error: ", error);
        process.exit(1);
    }
};
