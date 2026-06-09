"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  Building2,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["ADMIN"] },
  { label: "Rooms", href: "/admin/rooms", icon: DoorOpen, roles: ["ADMIN"] },
  { label: "Tenants", href: "/admin/tenants", icon: Users, roles: ["ADMIN"] },
  { label: "Payments", href: "/admin/payments", icon: CreditCard, roles: ["ADMIN"] },
  { label: "Expenses", href: "/admin/expenses", icon: Receipt, roles: ["ADMIN"] },
  { label: "Reports", href: "/admin/reports", icon: BarChart3, roles: ["ADMIN"] },
  { label: "Settings", href: "/admin/settings", icon: Settings, roles: ["ADMIN"] },

  { label: "Dashboard", href: "/manager", icon: LayoutDashboard, roles: ["MANAGER"] },
  { label: "Rooms", href: "/manager/rooms", icon: DoorOpen, roles: ["MANAGER"] },
  { label: "Tenants", href: "/manager/tenants", icon: Users, roles: ["MANAGER"] },
  { label: "Payments", href: "/manager/payments", icon: CreditCard, roles: ["MANAGER"] },
  { label: "Expenses", href: "/manager/expenses", icon: Receipt, roles: ["MANAGER"] },

  { label: "Dashboard", href: "/tenant", icon: LayoutDashboard, roles: ["TENANT"] },
  { label: "My Profile", href: "/tenant/profile", icon: Users, roles: ["TENANT"] },
  { label: "Payments", href: "/tenant/payments", icon: CreditCard, roles: ["TENANT"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role || "";

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));
  const rolePrefix = userRole === "ADMIN" ? "/admin" : userRole === "MANAGER" ? "/manager" : "/tenant";

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">PG Manager</h2>
            <p className="text-xs text-gray-500 capitalize">{userRole.toLowerCase()}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredItems
          .filter((item) => item.href.startsWith(rolePrefix))
          .map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== rolePrefix && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
