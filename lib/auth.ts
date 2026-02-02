import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { prisma } from "./prisma";


export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mysql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: { 
    enabled: true, 
  }, 

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "driver",
      },
    },
  },
});