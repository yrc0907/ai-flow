"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  AppWindow,
  Database,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  workspaceId?: string;
}

export default function Sidebar({ workspaceId }: SidebarProps) {
  const pathname = usePathname();

  const isWorkspacePage = workspaceId !== undefined;

  const mainItems = [
    {
      name: "工作区",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
  ];

  const workspaceItems = workspaceId
    ? [
        {
          name: "应用",
          href: `/dashboard/workspaces/${workspaceId}/apps`,
          icon: AppWindow,
        },
        {
          name: "知识库",
          href: `/dashboard/workspaces/${workspaceId}/knowledge`,
          icon: Database,
        },
        {
          name: "设置",
          href: `/dashboard/workspaces/${workspaceId}/settings`,
          icon: Settings,
        },
      ]
    : [];

  return (
    <div className="flex flex-col h-full border-r bg-background">
      <div className="p-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          AI Flow
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {isWorkspacePage && (
            <Button asChild variant="ghost" className="justify-start mb-4">
              <Link href="/dashboard">
                <ChevronLeft className="mr-2 h-4 w-4" />
                返回工作区列表
              </Link>
            </Button>
          )}

          {(isWorkspacePage ? workspaceItems : mainItems).map((item) => (
            <Button
              key={item.href}
              asChild
              variant={pathname === item.href ? "secondary" : "ghost"}
              className="justify-start"
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </Button>
      </div>
    </div>
  );
}
