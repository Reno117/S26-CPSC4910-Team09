import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { prisma } from "./prisma";
import { createAuthMiddleware } from "better-auth/api";

const authBaseURL =
  process.env.BETTER_AUTH_BASE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://main.d3snic3demckqa.amplifyapp.com"
    : "http://localhost:3000");


export const auth = betterAuth({
  baseURL: authBaseURL,
  trustedOrigins : ["http://localhost:3000", "https://main.d3snic3demckqa.amplifyapp.com"],
  hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (!ctx.path.startsWith("/sign-in")) return;

            const email = (ctx.body as { email?: string } | undefined)?.email;
            if (!email) return;

            const user = await prisma.user.findUnique({
              where: { email },
              select: {
                role: true,
                driverProfile: {
                  select: {
                    status: true,
                  },
                },
              },
            });

            if (user?.role === "driver" && user.driverProfile?.status === "dropped") {
              throw new Error("This driver account has been dropped and can no longer sign in.");
            }
        }),
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