import { RouterProvider } from "react-router-dom";
import { TooltipProvider, Toaster } from "@markdown-editor/ui";
import { router } from "./router";
import { ThemeProvider } from "./theme/ThemeProvider";

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" richColors />
      </TooltipProvider>
    </ThemeProvider>
  );
}
