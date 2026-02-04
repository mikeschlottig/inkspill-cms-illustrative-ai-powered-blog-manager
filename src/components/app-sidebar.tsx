import React from "react";
import { Book, PenTool, Settings, HelpCircle, Archive } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarSeparator,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  return (
    <Sidebar className="border-r-2 border-black">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center text-white font-hand text-2xl">IS</div>
          <div>
            <span className="block text-xl font-hand leading-none">InkSpill</span>
            <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Creative CMS</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/"}>
                <Link to="/">
                  <Book className="w-5 h-5" /> 
                  <span className="font-hand text-lg">Sketchbook</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname.startsWith("/editor")}>
                <Link to="/editor/new">
                  <PenTool className="w-5 h-5" /> 
                  <span className="font-hand text-lg">New Sketch</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator className="bg-black/10 mx-4 h-[2px]" />
        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-[10px] uppercase">Organization</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/">
                  <Archive className="w-5 h-5" /> 
                  <span className="font-hand text-lg">Archive</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/settings"}>
                <Link to="/settings">
                  <Settings className="w-5 h-5" /> 
                  <span className="font-hand text-lg">Toolbox</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t-2 border-black/10">
        <SidebarMenuButton asChild>
          <a href="#">
            <HelpCircle className="w-5 h-5" /> 
            <span className="font-hand text-lg">Inkwell Help</span>
          </a>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}