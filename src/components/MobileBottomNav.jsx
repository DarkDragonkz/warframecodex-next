"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", key: "home" },
  { href: "/arsenal", label: "Arsenal", key: "arsenal" },
  { href: "/entities", label: "Entities", key: "entities" },
  { href: "/upgrades", label: "Upgrades", key: "upgrades" },
];

function resolveActiveKey(pathname) {
  if (pathname === "/") return "home";
  if (/^\/(arsenal|primary|secondary|melee|arch-gun|arch-melee)(\/|$)/.test(pathname)) {
    return "arsenal";
  }
  if (/^\/(entities|warframes|companions|archwings|sentinels|pets)(\/|$)/.test(pathname)) {
    return "entities";
  }
  if (/^\/(upgrades|mods|relics|arcanes)(\/|$)/.test(pathname)) {
    return "upgrades";
  }
  if (/^\/list\/(primary|secondary|melee|arch-gun|arch-melee)(\/|$)/.test(pathname)) {
    return "arsenal";
  }
  if (/^\/list\/(warframes|companions|archwings|sentinels|pets)(\/|$)/.test(pathname)) {
    return "entities";
  }
  if (/^\/list\/(mods|relics|arcanes)(\/|$)/.test(pathname)) {
    return "upgrades";
  }
  return "";
}

export default function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const activeKey = resolveActiveKey(pathname);

  return (
    <nav className="mobile-bottom-nav">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          prefetch={false}
          className={`mobile-bottom-link ${activeKey === item.key ? "active" : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
