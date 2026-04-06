import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { FileTextIcon, LogOutIcon, SearchIcon, PlusIcon } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
  SidebarSeparator,
  Button,
} from "@markdown-editor/ui";
import { useAuth } from "@/auth/hooks";
import { usePages } from "@/editor/hooks/usePages";
import { PageTreeNav } from "./PageTreeNav";

export function DashboardShell() {
  const { currentUser, logout } = useAuth();
  const { loadPageTree, pageTree } = usePages();
  const navigate = useNavigate();

  useEffect(() => {
    void loadPageTree();
  }, [loadPageTree]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="cursor-default">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <FileTextIcon className="size-4" />
                </div>
                <span className="truncate font-semibold">WikiSync</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarGroup className="py-0 group-data-[collapsible=icon]:hidden">
            <SidebarGroupContent className="relative">
              <label htmlFor="sidebar-search" className="sr-only">
                Search
              </label>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
              <SidebarInput id="sidebar-search" placeholder="Search pages..." className="pl-8" />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupContent>
              <PageTreeNav pageTree={pageTree} />
            </SidebarGroupContent>
          </SidebarGroup>
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

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <Button
              size="sm"
              onClick={() => {
                void navigate("/dashboard/pages/new");
              }}
            >
              <PlusIcon className="size-4" />
              New
            </Button>
          </div>
        </header>
        <main className="flex flex-1 flex-col p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
