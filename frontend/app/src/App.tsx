import { RouterProvider } from "react-router-dom";
import { TooltipProvider, Toaster } from "@markdown-editor/ui";
import { router } from "./router";

export default function App() {
  return (
    <TooltipProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors />
    </TooltipProvider>
  );
}
