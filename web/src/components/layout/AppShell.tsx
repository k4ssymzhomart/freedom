import * as React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BarChart3, ChevronsLeft, ChevronsRight, ListChecks, MessagesSquare, Settings, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUi, type Role } from "@/store/ui";
import { notifyInfo } from "@/lib/toast";
import { LANGS, setLang, type Lang } from "@/i18n";
import { useAppeals, useHealth, useSettings } from "@/api/queries";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/tabs";
import { MOCK } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TitleSlotProvider } from "@/components/chrome";
import { FreedomLogo } from "@/components/FreedomLogo";

const NAV = [
  { to: "/conversations", key: "nav.conversations", icon: MessagesSquare },
  { to: "/checklists", key: "nav.checklists", icon: ListChecks },
  { to: "/review", key: "nav.review", icon: ShieldCheck, count: "appeals" },
  { to: "/analytics", key: "nav.analytics", icon: BarChart3 },
] as const;
const NAV_BOTTOM = [{ to: "/settings", key: "nav.settings", icon: Settings }] as const;

/** Each role has a home screen (docs/ROLES.md §2): switching the role opens it. */
const ROLE_HOME: Record<Role, { to: string; key: string }> = {
  analyst: { to: "/conversations", key: "nav.conversations" },
  reviewer: { to: "/review", key: "nav.review" },
};

function useSwitchRole() {
  const { t } = useTranslation();
  const { role, setRole } = useUi();
  const navigate = useNavigate();
  return (next: Role) => {
    if (next === role) return;
    setRole(next);
    const home = ROLE_HOME[next];
    navigate(home.to);
    notifyInfo(t("role.switched", { role: t(`role.${next}`) }), t("role.switchedHint", { home: t(home.key) }));
  };
}

function Wordmark({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={cn("flex flex-col gap-2 pl-2", collapsed && "items-center pl-0")}>
      <FreedomLogo height={collapsed ? 30 : 26} showWordmark={!collapsed} />
      {!collapsed ? (
        <div className="flex items-center gap-2 pl-0.5">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-text">{t("app.name")}</span>
          <span className="h-3 w-px bg-line" />
          <span className="truncate text-[12px] text-text-2">{t("app.tagline")}</span>
        </div>
      ) : null}
    </div>
  );
}

function NavItem({ to, label, icon: Icon, count, collapsed }: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; count?: number; collapsed: boolean }) {
  return (
    <Hint label={collapsed ? label : undefined} side="right">
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            "relative flex h-10 items-center gap-3 rounded-[12px] pl-3 pr-2.5 text-body font-medium text-text transition-colors hover:bg-surface-2/70",
            isActive && "bg-accent-subtle hover:bg-accent-subtle",
            collapsed && "justify-center px-0",
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon className={cn("size-5 shrink-0", !isActive && "opacity-70")} />
            {!collapsed ? <span className={cn("flex-1 truncate", !isActive && "opacity-75")}>{label}</span> : null}
            {!collapsed && count ? <span className={cn("num min-w-[22px] rounded-full px-[7px] py-[2px] text-center font-mono text-[12px] leading-[1.4]", isActive ? "bg-surface" : "bg-surface-2")}>{count}</span> : null}
            {collapsed && count ? <span className="absolute right-2.5 top-2 size-2 rounded-full bg-dot-warn" /> : null}
          </>
        )}
      </NavLink>
    </Hint>
  );
}

export function SideNav() {
  const { t } = useTranslation();
  const { navCollapsed, setNavCollapsed, role } = useUi();
  const switchRole = useSwitchRole();
  const openAppeals = useAppeals("open");
  const appealsCount = (openAppeals.data ?? []).filter((a) => a.status === "open").length;
  return (
    <aside className={cn("flex h-full shrink-0 flex-col border-r border-line bg-bg pb-4 pt-5 transition-[width] duration-200", navCollapsed ? "w-[76px] px-3" : "w-64 px-4")}>
      <Wordmark collapsed={navCollapsed} />
      <nav className="mt-5 flex flex-col gap-0.5">
        {NAV.map((n) => (
          <NavItem key={n.to} to={n.to} label={t(n.key)} icon={n.icon} count={"count" in n ? appealsCount : undefined} collapsed={navCollapsed} />
        ))}
        <div className="h-4" />
        {NAV_BOTTOM.map((n) => (
          <NavItem key={n.to} to={n.to} label={t(n.key)} icon={n.icon} collapsed={navCollapsed} />
        ))}
      </nav>
      <div className="flex-1" />
      {!navCollapsed ? (
        <div className="mb-3 flex flex-col gap-2.5 rounded-md bg-surface-2/70 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand font-display text-[13px] font-semibold text-white">{t(`role.${role}`).slice(0, 1)}</div>
            <div className="min-w-0 leading-tight">
              <div className="label">{t("role.label")}</div>
              <div className="mt-0.5 truncate text-caption font-semibold">{t(`role.${role}`)}</div>
            </div>
          </div>
          <p className="text-small leading-[1.4] text-text-2">{t(`role.desc_${role}`)}</p>
          <Segmented
            value={role}
            onChange={switchRole}
            size="sm"
            className="flex w-full bg-surface"
            itemClassName="flex-1"
            options={(["analyst", "reviewer"] as const).map((r) => ({ value: r, label: t(`role.${r}`) }))}
          />
        </div>
      ) : (
        <Hint label={t(`role.${role}`)} side="right">
          <button
            type="button"
            onClick={() => switchRole(role === "analyst" ? "reviewer" : "analyst")}
            aria-label={t(`role.${role}`)}
            className="mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-brand font-display text-[13px] font-semibold text-white transition-[filter] hover:brightness-95"
          >
            {t(`role.${role}`).slice(0, 1)}
          </button>
        </Hint>
      )}
      <Button
        variant="ghost"
        size={navCollapsed ? "icon" : "sm"}
        className={cn("text-text-2", navCollapsed ? "mx-auto" : "w-full justify-start")}
        onClick={() => setNavCollapsed(!navCollapsed)}
        title={navCollapsed ? t("nav.expand") : t("nav.collapse")}
        aria-label={navCollapsed ? t("nav.expand") : t("nav.collapse")}
      >
        {navCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
        {!navCollapsed ? <span>{t("nav.collapse")}</span> : null}
      </Button>
    </aside>
  );
}

export function TopBar({ slotRef }: { slotRef: (el: HTMLDivElement | null) => void }) {
  const { t, i18n } = useTranslation();
  const settings = useSettings();
  const health = useHealth();
  const provider = settings.data?.default_provider;
  const model = provider === "local" ? settings.data?.local_model : settings.data?.default_model;
  const online = !!health.data?.ok;

  return (
    <header className="flex h-20 shrink-0 items-center gap-3 border-b border-line bg-bg px-8">
      <div ref={slotRef} className="flex min-w-0 flex-1 items-center" />
      {MOCK ? <Badge variant="warning">mock</Badge> : null}
      <Hint label={online ? `${t("settings.api")}: ${t("settings.ok")}` : t("provider.offline")}>
        <div className="hidden h-10 max-w-[320px] items-center gap-2 rounded-full bg-surface-2 pl-3.5 pr-4 md:inline-flex">
          <span className={cn("dot", online ? "bg-dot-ok" : "bg-dot-flag")} />
          {provider ? (
            <span className="truncate font-mono text-[12px] text-text">
              {t(`provider.${provider}` as never, { defaultValue: provider })}
              {model ? <span className="text-text-2"> · {String(model).replace(/^anthropic:/, "")}</span> : null}
            </span>
          ) : (
            <span className="font-mono text-[12px] text-text-2">{online ? t("provider.badge") : t("provider.offline")}</span>
          )}
        </div>
      </Hint>
      <Segmented
        value={(LANGS as readonly string[]).includes(i18n.language) ? i18n.language : LANGS[0]}
        onChange={(l) => setLang(l as Lang)}
        itemClassName="px-3 font-mono text-[12px]"
        options={LANGS.map((l) => ({ value: l as string, label: t(`lang.${l}`) }))}
      />
    </header>
  );
}

export function AppShell() {
  const location = useLocation();
  const mainRef = React.useRef<HTMLElement>(null);
  const [slot, setSlot] = React.useState<HTMLDivElement | null>(null);
  React.useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);
  return (
    <TitleSlotProvider slot={slot}>
      <div className="flex h-full w-full overflow-hidden bg-bg">
        <SideNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar slotRef={setSlot} />
          <main ref={mainRef} className="min-h-0 flex-1 overflow-auto">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </TitleSlotProvider>
  );
}
