import { betterAuth } from "better-auth"; const auth = betterAuth({ database: {} as any, account: { accountLinking: { enabled: true, trustedProviders: ["google"] } } });
