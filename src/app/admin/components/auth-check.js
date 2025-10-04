"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/lib/firebase";

export default function AuthCheck({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip Firebase auth during build time or if auth is not available
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Só faz o controle de expiração se o usuário está autenticado
        const loginTime = localStorage.getItem("admin_login_time");
        if (loginTime && Date.now() - Number(loginTime) > 60 * 60 * 10000) {
          // Sessão expirou
          if (auth) {
            auth.signOut();
          }
          localStorage.removeItem("admin_login_time");
          router.push("/admin/login");
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Só redireciona para login se não está autenticado e não está carregando
    if (typeof window !== "undefined") {
      router.push("/admin/login");
    }
    return null;
  }

  return <>{children}</>;
}
