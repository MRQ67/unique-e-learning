"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard/student", label: "Student Dashboard" },
    { href: "/dashboard/instructor", label: "Instructor Dashboard" },
    { href: "/dashboard/admin", label: "Admin Dashboard" },
    { href: "/courses", label: "Courses" },
    { href: "/exams", label: "Exams" },
  ];

  return (
    <aside className="w-64 bg-white border-r h-screen p-4">
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block px-3 py-2 rounded hover:bg-gray-100 ${pathname === item.href ? 'bg-gray-200 font-medium' : ''}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
