import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react
import type { auth } from "./auth";


export const authClient =  createAuthClient({
    //you can pass client configuration here
    baseURL: process.env.NODE_ENV === "production" ? "https://main.d3snic3demckqa.amplifyapp.com/" : "http://localhost:3000",

    plugins: [inferAdditionalFields<typeof auth>()],




})