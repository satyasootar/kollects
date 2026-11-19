import crypto from "crypto";
import config from "../config/config.js";

/**
 * Keyed hash of a client IP. A plain SHA-256 of an IPv4 address can be brute-forced back to the
 * IP in minutes; without IP_HASH_KEY the HMAC can't be.
 */
export const hashIp = (ip: string) => crypto.createHmac("sha256", config.IP_HASH_KEY).update(ip).digest("hex");
