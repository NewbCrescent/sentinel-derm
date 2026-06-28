import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  return {
    url,
    publishableKey,
  };
}

export async function createDashboardSupabaseClient() {
  const config = getSupabaseConfig();

  if (!config) {
    return {
      data: null,
      error: "Dashboard Supabase configuration is missing.",
    };
  }

  const cookieStore = await cookies();

  return {
    data: createServerClient(config.url, config.publishableKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies; Server Actions and Route Handlers can.
          }
        },
      },
    }),
    error: null,
  };
}
