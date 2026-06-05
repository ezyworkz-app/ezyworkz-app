"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbProps {
  pageTitle?: string;
  hideTitle?: boolean;
  children?: React.ReactNode;
}

const routeTitleMap: Record<string, string> = {
  admin: "Admin",
  orders: "Orders",
  shops: "Shops",
  users: "Users",
  details: "Details",
  services: "Services",
  marketing: "Marketing",
  globals: "Globals",
  calendar: "Calendar",
  chat: "Chat",
  "line-chart": "Line Chart",
  "bar-chart": "Bar Chart",
  "basic-tables": "Basic Tables",
  "form-elements": "Form Elements",
  buttons: "Buttons",
  videos: "Videos",
  modals: "Modals",
  images: "Images",
  badge: "Badge",
  avatars: "Avatars",
  alerts: "Alerts",
};

import { useBreadcrumb } from "@/context/BreadcrumbContext";

interface breadcrumbItem {
    title: string;
    href: string;
    isLast: boolean;
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, hideTitle, children }) => {
  const pathname = usePathname();
  const { customChildren, customTitle } = useBreadcrumb();
  
  const rawSegments = pathname
    .split("/")
    .filter((segment) => segment !== "" && segment !== "(admin)");

  const breadcrumbs: breadcrumbItem[] = [];
  
  rawSegments.forEach((segment, index) => {
    // Check if segment is a dynamic ID (heuristic: contains numbers or long hex)
    const isDynamic = segment.length > 20 || (segment.length > 8 && /\d/.test(segment));
    const isActuallyLast = index === rawSegments.length - 1;

    // We add it if it's not dynamic OR if it's dynamic but it's the very last segment 
    // (so we have a label for the current page even if it's just an ID or overridden by customTitle)
    if (!isDynamic || isActuallyLast) {
        const href = `/${rawSegments.slice(0, index + 1).join("/")}`;
        let title = routeTitleMap[segment] || segment;
        title = title.charAt(0).toUpperCase() + title.slice(1).replace(/-/g, " ");
        breadcrumbs.push({ title, href, isLast: false });
    }
  });

  // Mark the actual last one as isLast
  if (breadcrumbs.length > 0) {
    breadcrumbs[breadcrumbs.length - 1].isLast = true;
  }

  // Use priority: 1. prop pageTitle, 2. context customTitle, 3. last breadcrumb or Dashboard
  const displayTitle = pageTitle || customTitle || (breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].title : "Dashboard");
  const displayChildren = children || customChildren;

  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ${hideTitle ? "mb-4" : "mb-6"}`}>
      <div className="flex flex-col gap-1 overflow-hidden">
      <nav>
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-brand-500 transition-colors dark:text-gray-500 dark:hover:text-brand-400"
              href="/"
            >
              <Home size={14} />
              Home
            </Link>
          </li>
          
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              <li className="text-gray-300 dark:text-gray-600">
                <ChevronRight size={12} />
              </li>
              <li>
                {crumb.isLast ? (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                    {crumb.title}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-sm font-medium text-gray-400 hover:text-brand-500 transition-colors dark:text-gray-500 dark:hover:text-brand-400"
                  >
                    {crumb.title}
                  </Link>
                )}
              </li>
            </React.Fragment>
          ))}
        </ol>
      </nav>
      </div>
      {displayChildren && <div className="flex-1 max-w-2xl mx-auto w-full md:mx-4">{displayChildren}</div>}
    </div>
  );
};

export default PageBreadcrumb;
