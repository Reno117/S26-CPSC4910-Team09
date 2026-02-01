"use client";
import { prisma } from "@/lib/prisma";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  // const result = await prisma.user.findMany();

  const r = authClient.useSession();

  const onSignup = () => {
    authClient.signUp.email({
      email: "test2@gmail.com",
      password: "password",
      name: "bureger",
    });
  };
  const onSignIn = () => {
    authClient.signUp.email({
      email: "test2@gmail.com",
      password: "password",
      name: "bureger",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <button onClick={onSignup}>Sign Up</button>
        <button onClick={onSignIn}>Sign In</button>
        <>{r.data?.user.name}</>
        <button
          onClick={() => {
            authClient.signOut();
          }}
        >
          Sign out
        </button>

        {/* <h1>DB Test Result:</h1>
        <pre>
          {
            <pre>
              {result.map((user, i) => (
                <div key={user.id}>
                  User {i}: {JSON.stringify(user, null, 2)}
                </div>
              ))}
            </pre>
          }
        </pre> */}

        {/* Form for user input */}
        <form className="flex flex-col gap-2">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="border px-2 py-1"
          />

          <select
            name="role"
            defaultValue="DRIVER"
            required
            className="border px-2 py-1"
          >
            <option value="ADMIN">Admin</option>
            <option value="SPONSOR">Sponsor</option>
            <option value="DRIVER">Driver</option>
          </select>

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Create User
          </button>
        </form>
      </main>
    </div>
  );
}
