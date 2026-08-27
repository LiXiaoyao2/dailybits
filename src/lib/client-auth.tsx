"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SessionStatus = "authenticated" | "unauthenticated" | "loading";

interface ClientSessionUser {
  id: string;
  uid?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  department?: string;
  isAdmin?: boolean;
}

interface ClientSession {
  user: ClientSessionUser;
}

interface ClientAuthContextValue {
  data: ClientSession | null;
  status: SessionStatus;
}

const ClientAuthContext = createContext<ClientAuthContextValue>({
  data: null,
  status: "loading",
});

export function GatewaySessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/me", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (cancelled) return;

        if (response.status === 401) {
          setSession(null);
          setStatus("unauthenticated");
          window.location.reload();
          return;
        }

        if (!response.ok) {
          setSession(null);
          setStatus("unauthenticated");
          return;
        }

        const user = await response.json();
        if (cancelled) return;
        setSession({ user });
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        setSession(null);
        setStatus("unauthenticated");
      }
    }

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ data: session, status }), [session, status]);
  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useSession(): ClientAuthContextValue {
  return useContext(ClientAuthContext);
}

export function startLogin(): void {
  window.location.reload();
}

export function signOut(): void {
  window.location.href = "/__auth/logout";
}
