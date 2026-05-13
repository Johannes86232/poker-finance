"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const nav = [
  { section: "Overview", items: [{ label: "Dashboard", href: "/admin", icon: "ti-layout-dashboard" }] },
  {
    section: "Management",
    items: [
      { label: "Users", href: "/admin/users", icon: "ti-users" },
      { label: "Clubs", href: "/admin/clubs", icon: "ti-building" },
      { label: "Accounts", href: "/admin/accounts", icon: "ti-id-badge" },
      { label: "Deals", href: "/admin/deals", icon: "ti-file-invoice" },
    ],
  },
  {
    section: "Finance",
    items: [
      { label: "Transactions", href: "/admin/transactions", icon: "ti-arrows-exchange" },
      { label: "Weekly", href: "/admin/weeks", icon: "ti-calendar-week" },
      { label: "Import Reports", href: "/admin/import", icon: "ti-upload" },
      { label: "FX Rates", href: "/admin/exchange-rates", icon: "ti-currency-dollar" },
    ],
  },
]

const bottomNav = [
  { label: "Dashboard", href: "/admin", icon: "ti-layout-dashboard" },
  { label: "Users", href: "/admin/users", icon: "ti-users" },
  { label: "Clubs", href: "/admin/clubs", icon: "ti-building" },
  { label: "Transactions", href: "/admin/transactions", icon: "ti-arrows-exchange" },
  { label: "Import", href: "/admin/import", icon: "ti-upload" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="page-layout">
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
      />

      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">PF</div>
          <div>
            <div className="sidebar-logo-text">Poker Finance</div>
            <div className="sidebar-logo-sub">Admin Console</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map((group) => (
            <div key={group.section}>
              <div className="sidebar-section">{group.section}</div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item ${pathname === item.href ? "active" : ""}`}
                >
                  <i className={`ti ${item.icon}`} aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">A</div>
            <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>Admin</span>
            <i className="ti ti-logout" style={{ fontSize: 13, color: "var(--text-tertiary)" }} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="page-content">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        {bottomNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${pathname === item.href ? "active" : ""}`}
          >
            <i className={`ti ${item.icon}`} aria-hidden="true" />
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
