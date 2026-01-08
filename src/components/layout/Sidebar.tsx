import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, Store, Server, Monitor, Settings } from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: "grid" },
  { path: "/marketplace", label: "Marketplace", icon: "store" },
  { path: "/servers", label: "Servers", icon: "server" },
  { path: "/clients", label: "Clients", icon: "monitor" },
  { path: "/settings", label: "Settings", icon: "settings" },
];

function NavIcon({ icon }: { icon: string }) {
  const icons: Record<string, ReactNode> = {
    grid: <LayoutGrid className="w-5 h-5" />,
    store: <Store className="w-5 h-5" />,
    server: <Server className="w-5 h-5" />,
    monitor: <Monitor className="w-5 h-5" />,
    settings: <Settings className="w-5 h-5" />,
  };
  return icons[icon] || null;
}

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">MCP Nexus</h1>
      </div>
      <nav
        className="flex-1 p-4"
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )
                }
              >
                <NavIcon icon={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-800 text-sm text-gray-500">
        v0.1.0
      </div>
    </aside>
  );
}
