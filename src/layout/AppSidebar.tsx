"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useShop } from "@/context/ShopContext";
import { formatAssetUrl } from "@/utils/format";
import { Store } from "lucide-react";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles?: ("owner" | "manager" | "staff" | "admin")[];
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    roles?: ("owner" | "manager" | "staff" | "admin")[];
  }[];
};

const rawNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    roles: ["owner", "manager", "admin"],
    subItems: [
      { name: "Overview", path: "/", roles: ["owner", "manager", "admin"] },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Users",
    roles: ["owner", "manager", "staff", "admin"],
    subItems: [
      { name: "Dashboard", path: "/users/dashboard", roles: ["owner", "manager", "admin"] },
      { name: "Acquisition", path: "/users/acquisition", roles: ["owner", "manager", "admin"] },
      { name: "User List", path: "/users", roles: ["owner", "manager", "staff", "admin"] },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Orders",
    roles: ["owner", "manager", "staff", "admin"],
    subItems: [
      { name: "Dashboard", path: "/orders/dashboard", roles: ["owner", "manager", "admin"] },
      { name: "Orders List", path: "/orders", roles: ["owner", "manager", "staff", "admin"] },
      { name: "Revenue Goals", path: "/orders/goals", roles: ["owner", "manager", "admin"] },
    ],
  },
  {
    icon: <TableIcon />,
    name: "Services",
    path: "/services",
    roles: ["owner", "manager", "staff", "admin"],
  },
  {
    icon: <PieChartIcon />,
    name: "Expenses",
    roles: ["owner", "manager", "admin"], // Hidden from Staff
    subItems: [
      { name: "Overview", path: "/expenses", roles: ["owner", "manager", "admin"] },
      { name: "Running Costs", path: "/expenses/running", roles: ["owner", "manager", "admin"] },
      { name: "Fixed Costs", path: "/expenses/fixed", roles: ["owner", "manager", "admin"] },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Shop Settings",
    roles: ["owner", "manager", "admin"], // Hidden from Staff
    subItems: [
      { name: "General Info", path: "/settings/general", roles: ["owner", "manager", "admin"] },
      { name: "Location & Timings", path: "/settings/location", roles: ["owner", "manager", "admin"] },
      { name: "Billing & Fees", path: "/settings/billing", roles: ["owner", "admin"] }, // Hidden from Manager & Staff
      { name: "WhatsApp Messaging", path: "/settings/whatsapp", roles: ["owner", "manager", "admin"] },
      { name: "Team & Managers", path: "/settings/team", roles: ["owner", "manager", "admin"] },
      { name: "Analytics", path: "/settings/analytics", roles: ["owner", "manager", "admin"] },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/profile",
    roles: ["owner", "manager", "staff", "admin"],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { selectedShop, userRole } = useShop();
  const pathname = usePathname();

  // Current active role (fallback to "owner")
  const activeRole = userRole || "owner";

  // Filter navigation items based on current role
  const filteredNavItems = useMemo(() => {
    return rawNavItems
      .filter((item) => !item.roles || item.roles.includes(activeRole as any))
      .map((item) => {
        if (!item.subItems) return item;
        const validSubItems = item.subItems.filter(
          (sub) => !sub.roles || sub.roles.includes(activeRole as any)
        );
        return {
          ...item,
          subItems: validSubItems,
        };
      })
      .filter((item) => !item.subItems || item.subItems.length > 0);
  }, [activeRole]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    filteredNavItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: "main",
              index,
            });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, filteredNavItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, "main")}
              className={`menu-item group ${
                openSubmenu?.type === "main" && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
              }`}
            >
              <span
                className={`${
                  openSubmenu?.type === "main" && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === "main" && openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`main-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === "main" && openSubmenu?.index === index
                    ? `${subMenuHeight[`main-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-3">
              {selectedShop?.logoUrl ? (
                <Image
                  src={formatAssetUrl(selectedShop.logoUrl)}
                  alt={selectedShop.name || "Logo"}
                  width={40}
                  height={40}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <Image
                  src="/ezyworkz_logo_png.png"
                  alt="Ezyworkz Logo"
                  width={40}
                  height={40}
                  className="object-contain rounded-lg shrink-0"
                  unoptimized
                />
              )}
              <span className="text-xl font-bold font-outfit text-gray-900 dark:text-white truncate max-w-[170px]">
                {selectedShop?.name || "Ezyworkz"}
              </span>
            </div>
          ) : selectedShop?.logoUrl ? (
            <Image
              src={formatAssetUrl(selectedShop.logoUrl)}
              alt={selectedShop.name || "Logo"}
              width={40}
              height={40}
              className="object-contain"
              unoptimized
            />
          ) : (
            <Image
              src="/ezyworkz_logo_png.png"
              alt="Ezyworkz Logo"
              width={40}
              height={40}
              className="object-contain rounded-lg shrink-0"
              unoptimized
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(filteredNavItems)}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
