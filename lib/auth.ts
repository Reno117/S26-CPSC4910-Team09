import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { prisma } from "./prisma";
import { createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins";

const authBaseURL =
  process.env.BETTER_AUTH_BASE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://main.d3snic3demckqa.amplifyapp.com"
    : "http://localhost:3000");


export const auth = betterAuth({
  plugins: [
    admin({
      defaultRole: "user",
      impersonationSessionDuration: 60 * 60, // 1 hour
    }),
  ],
  baseURL: authBaseURL,
  trustedOrigins : ["http://localhost:3000", "https://main.d3snic3demckqa.amplifyapp.com"],
  hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path.startsWith("/sign-in")) {

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
          }
             if (ctx.path.includes("/admin/impersonate-user")) {
            const session = ctx.context?.session;
            if (!session) throw new Error("Not authenticated.");

            const requestorRole = session.user.role;
            const targetUserId = (ctx.body as { userId?: string })?.userId;

            // Admins can impersonate anyone
            if (requestorRole === "admin") return;

            // Sponsors can only impersonate their sponsored users
            if (requestorRole === "sponsor") {
              if (!targetUserId) throw new Error("No target user specified.");

              const sponsorUser = await prisma.sponsorUser.findUnique({
                where: { userId: session.user.id },
                select: { sponsorId: true },
              });

              if(!sponsorUser) throw new Error("Sponsor user record not found.");

              const driverProfile = await prisma.driverProfile.findUnique({
                where: { userId: targetUserId },
                  select: {
                    sponsorships: {
                      where: { sponsorOrgId: sponsorUser.sponsorId },
                      select: { id: true },
                      },
                    },
                });

                if (!driverProfile?.sponsorships.length) {
                  throw new Error("You are not authorized to impersonate this user.");
                }
                return;
              }
              throw new Error("You are not authorized to impersonate users.");
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