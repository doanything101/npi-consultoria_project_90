"use client";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "./components/sidebar";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { User2Icon } from "lucide-react";
import Link from "next/link";

// Disable static generation for all admin pages
export const dynamic = 'force-dynamic';

// Carregar a fonte Inter no lado do cliente para evitar problemas de hidratação
const inter = Inter({ subsets: ["latin"] });

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Marcar componente como montado para evitar problemas de hidratação
    setMounted(true);

    // Skip Firebase auth during build time or if auth is not available
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }

    // Verificar autenticação com Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Controle de expiração de sessão (1 hora)
        const loginTime = localStorage.getItem("admin_login_time");
        if (loginTime && Date.now() - Number(loginTime) > 60 * 60 * 1000) {
          auth.signOut();
          localStorage.removeItem("admin_login_time");
          window.location.href = "/admin/login";
          setIsLoggedIn(false);
          setIsAuthLoading(false);
          return;
        }
        setIsLoggedIn(true);
        setDisplayName(user.displayName || "Usuário");
        setUserEmail(user.email || "email@example.com");
        setIsAuthLoading(false);
      } else {
        setIsLoggedIn(false);
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Não renderizar nada durante SSR para componentes que dependem de estado do cliente
  if (!mounted) {
    return null;
  }

  // Enquanto está carregando autenticação, mostra um loading
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  // Se for a página de login, não aplica este layout (usa o layout específico de login)
  if (pathname === "/admin/login") {
    return children;
  }

  // Redirecionar para login se não estiver autenticado e não estiver na página de login
  if (!isAuthLoading && !isLoggedIn && pathname !== "/admin/login") {
    // Usando client-side redirect aqui, já que estamos em um componente cliente
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
      return null;
    }
  }

  return (
    <div className={`min-h-screen bg-gray-100 text-xs ${inter.className}`}>
      {/* Sidebar para navegação */}
      {isLoggedIn && <Sidebar />}

      {/* Conteúdo principal */}
      <div
        className={`min-h-screen ${
          isLoggedIn ? "ml-64" : ""
        } transition-all duration-300 ease-in-out`}
      >
        {isLoggedIn && (
          <header className="bg-black text-white ">
            <div className="flex justify-end items-center pr-10 py-4">
              <Link href="/admin/usuario" className="flex items-center">
                <User2Icon className="w-8 h-8 mr-2" />
                <span className="mr-4">{displayName}</span>
              </Link>

              <button
                onClick={() => {
                  if (auth) {
                    auth.signOut();
                  }
                  localStorage.removeItem("admin_login_time");
                  window.location.href = "/admin/login";
                }}
                className=" text-white border-2 border-white rounded-md px-4 py-2 hover:border-gray-700 hover:text-gray-700 transition-all"
              >
                Sair
              </button>
            </div>
          </header>
        )}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}