"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg">Redirecting...</div>
    </div>
  );
}
