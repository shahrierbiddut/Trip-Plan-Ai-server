import { MongoClient } from "mongodb";
import sendEmail from '../utils/sendEmail.js';

let authInstance: any = null;

export const getAuth = async () => {
  if (authInstance) return authInstance;

  const { betterAuth } = await import("better-auth");
  const { mongodbAdapter } = await import("@better-auth/mongo-adapter");
  const client = new MongoClient(process.env.MONGODB_URI as string);
  const db = client.db(process.env.DB_NAME as string);
  const defaultOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://trip-plan-client.vercel.app",
    "https://trip-plan-admin.vercel.app",
  ];

  const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? defaultOrigins;

  const baseURL = process.env.NODE_ENV === "production" 
    ? "https://trip-plan-server.vercel.app/api/auth" 
    : "http://localhost:5000/api/auth";

  authInstance = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL,
    trustedOrigins,
    advanced: {
      cookiePrefix: "my_app_v2",
      crossSubDomainCookies: {
        enabled: true
      },
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true
      }
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        const message = `You requested a password reset. Please click this link to set a new password: \n\n ${url}`;
        try {
          await sendEmail({
            to: user.email,
            subject: "Password Reset Request",
            text: message,
          });
          console.log(`Reset email sent successfully to ${user.email}`);
        } catch (error) {
          console.error("Failed to send reset email via BetterAuth:", error);
        }
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    database: mongodbAdapter(db, {
      client,
    }),
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "Registered User",
        },
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"]
      }
    }
  });

  return authInstance;
};
