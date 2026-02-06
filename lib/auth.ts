import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { prisma } from "./prisma";
import { createAuthMiddleware } from "better-auth/api";


export const auth = betterAuth({

  hooks: {
        after: createAuthMiddleware(async (ctx) => {
            if(ctx.path.startsWith("/sign-up")){
              console.log("ctx", ctx.body)
              if ( ctx.body.role !== 'driver') return;
              if (!ctx.context.newSession) return;
              await prisma.driverProfile.create({
                data: {
                  userId: ctx.context.newSession.user.id
                }

              })



            }
        }),
    },

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