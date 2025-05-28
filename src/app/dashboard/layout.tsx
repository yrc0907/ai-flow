import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import Sidebar from "@/components/dashboard/Sidebar";

export const metadata = {
  title: "仪表盘 | AI Flow",
  description: "AI Flow平台仪表盘",
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
