import * as React from "react";
import { readStorage, writeStorage } from "@/lib/utils";

export type Role = "analyst" | "reviewer";
export type Theme = "dark" | "light";

interface UiState {
  role: Role;
  setRole: (r: Role) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  navCollapsed: boolean;
  setNavCollapsed: (v: boolean) => void;
}

const UiContext = React.createContext<UiState | null>(null);

/** The product ships a single white theme; `theme` stays in the API for callers but is always "light". */
function applyTheme(_t: Theme) {
  document.documentElement.classList.remove("dark");
}

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<Role>(() => (readStorage("cqa.role") === "reviewer" ? "reviewer" : "analyst"));
  const [theme, setThemeState] = React.useState<Theme>("light");
  const [navCollapsed, setNavCollapsedState] = React.useState<boolean>(() => readStorage("cqa.nav") === "collapsed");

  React.useEffect(() => applyTheme(theme), [theme]);

  const value = React.useMemo<UiState>(
    () => ({
      role,
      setRole: (r) => {
        setRoleState(r);
        writeStorage("cqa.role", r);
      },
      theme,
      setTheme: () => setThemeState("light"),
      navCollapsed,
      setNavCollapsed: (v) => {
        setNavCollapsedState(v);
        writeStorage("cqa.nav", v ? "collapsed" : "open");
      },
    }),
    [role, theme, navCollapsed],
  );
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiState {
  const ctx = React.useContext(UiContext);
  if (!ctx) throw new Error("useUi outside UiProvider");
  return ctx;
}
