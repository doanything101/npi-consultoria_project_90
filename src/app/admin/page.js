"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";

// Disable static generation for admin pages
export const dynamic = 'force-dynamic';

export default function AdminIndex() {
  // Remover redirecionamento automático
  return null;
}
