import { Outlet, NavLink } from "react-router-dom";
import { FileTextIcon, SettingsIcon, LogOutIcon } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from "@markdown-editor/ui";
import { useAuth } from "@/auth/hooks";

const NAV_ITEMS = [
  { to: "/dashboard/pages", label: "Pages", icon: FileTextIcon },
  { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

export function DashboardShell() {
  const { currentUser, logout } = useAuth();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <FileTextIcon className="h-4 w-4 text-white" />
            </div>
            <span className="truncate text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Markdown Editor
            </span>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarMenu>
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <SidebarMenuItem key={to}>
                <NavLink to={to}>
                  {({ isActive }) => (
                    <SidebarMenuButton isActive={isActive} tooltip={label}>
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator />
          {currentUser && (
            <p className="truncate px-2 py-1 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
              {currentUser.user.email}
            </p>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={logout}
                tooltip="Log out"
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
              >
                <LogOutIcon />
                <span>Log out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top bar with sidebar toggle */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-200 px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex flex-1 flex-col p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
