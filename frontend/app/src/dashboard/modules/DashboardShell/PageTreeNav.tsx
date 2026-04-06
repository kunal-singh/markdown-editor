import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@markdown-editor/ui";
import type { PageTreeNode } from "@markdown-editor/domain";

interface PageTreeNavNodeProps {
  node: PageTreeNode;
  isSubItem?: boolean;
}

function PageTreeNavNode({ node, isSubItem = false }: PageTreeNavNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const hasChildren = node.children.length > 0;

  const handleClick = () => {
    if (hasChildren) setIsOpen((prev) => !prev);
    void navigate(`/dashboard/pages/${node.id}`);
  };

  return (
    <SidebarMenuItem>
      {isSubItem ? (
        <SidebarMenuSubButton onClick={handleClick} className="cursor-pointer">
          {hasChildren && (
            <ChevronRight
              className={`size-3 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
            />
          )}
          <span className="truncate">{node.title}</span>
        </SidebarMenuSubButton>
      ) : (
        <SidebarMenuButton onClick={handleClick} tooltip={node.title} className="cursor-pointer">
          {hasChildren && (
            <ChevronRight
              className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
            />
          )}
          <span className="truncate">{node.title}</span>
        </SidebarMenuButton>
      )}
      {hasChildren && isOpen && (
        <SidebarMenuSub>
          {node.children.map((child) => (
            <SidebarMenuSubItem key={child.id}>
              <PageTreeNavNode node={child} isSubItem />
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

interface PageTreeNavProps {
  pageTree: PageTreeNode[];
}

export function PageTreeNav({ pageTree }: PageTreeNavProps) {
  if (pageTree.length === 0) return null;
  return (
    <SidebarMenu>
      {pageTree.map((node) => (
        <PageTreeNavNode key={node.id} node={node} />
      ))}
    </SidebarMenu>
  );
}
