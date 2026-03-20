"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#1a1a1a", color: "#888" }}>
        Loading...
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}
