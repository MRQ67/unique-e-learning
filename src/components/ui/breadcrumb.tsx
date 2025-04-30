"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface BreadcrumbProps {
  items: { href: string; label: string }[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-foreground/70")}>  
      <ol className="inline-flex items-center space-x-1">
        {items.map((item, idx) => (
          <li key={item.href} className="inline-flex items-center">
            <Link
              href={item.href}
              className={cn(
                "hover:text-foreground",
                pathname === item.href && "font-medium text-foreground"
              )}
            >
              {item.label}
            </Link>
            {idx < items.length - 1 && (
              <span className="mx-2 select-none">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
