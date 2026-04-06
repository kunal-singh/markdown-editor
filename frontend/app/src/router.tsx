import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useAtom } from "jotai";
import { currentUserAtom } from "@/auth/state/authAtoms";
import { LoginPage } from "@/auth/modules/LoginPage/LoginPage";
import { SignupPage } from "@/auth/modules/SignupPage/SignupPage";
import { DashboardShell } from "@/dashboard/modules/DashboardShell/DashboardShell";
import { PagesView } from "@/dashboard/modules/PagesView/PagesView";
import { SettingsView } from "@/dashboard/modules/SettingsView/SettingsView";
import { NewPageView } from "@/editor/modules/EditorView/NewPageView";
import { EditPageView } from "@/editor/modules/EditorView/EditPageView";

function PrivateRoute() {
  const [currentUser] = useAtom(currentUserAtom);
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PublicOnlyRoute() {
  const [currentUser] = useAtom(currentUserAtom);
  if (currentUser) return <Navigate to="/dashboard/pages" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/signup",
        element: <SignupPage />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: <PrivateRoute />,
    children: [
      {
        element: <DashboardShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard/pages" replace />,
          },
          {
            path: "pages",
            element: <PagesView />,
          },
          {
            path: "pages/new",
            element: <NewPageView />,
          },
          {
            path: "pages/:pageId",
            element: <EditPageView />,
          },
          {
            path: "settings",
            element: <SettingsView />,
          },
        ],
      },
    ],
  },
]);
