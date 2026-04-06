import { RouterProvider } from "react-router-dom";
import { TooltipProvider } from "@markdown-editor/ui";
import { router } from "./router";

export default function App() {
  return (
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>
  );
}
