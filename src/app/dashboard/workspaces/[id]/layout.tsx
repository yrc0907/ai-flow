import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import Sidebar from "@/components/dashboard/Sidebar";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: params.id },
  });

  return {
    title: workspace ? `${workspace.name} | AI Flow` : "工作区 | AI Flow",
    description: "AI Flow平台工作区",
  };
}

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { id: string };
}) {
  const session = await getServerSession();

  if (!session?.user || !session.user.email) {
    redirect("/auth/login");
  }

  // 从数据库获取用户信息
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser?.id) {
    console.error("无法从数据库获取用户ID，重定向到登录页面");
    redirect("/auth/login");
  }

  // 检查用户是否有权限访问此工作区
  const workspaceUser = await prisma.workspaceUser.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: params.id,
        userId: dbUser.id,
      },
    },
  });

  if (!workspaceUser) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <Sidebar workspaceId={params.id} />
      </div>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
