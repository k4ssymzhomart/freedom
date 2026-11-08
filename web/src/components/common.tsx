import * as React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ChevronDown, ChevronRight, Inbox, RefreshCw } from "lucide-react";
import { cn, copyText } from "@/lib/utils";
import { fmtScore, scoreTone, type ScoreTone } from "@/lib/format";
import { errorMessage, notify } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { PageTitle, useTitleSlot } from "@/components/chrome";
import type { ReviewState } from "@/api/types";

const toneText: Record<ScoreTone, string> = {
  critical: "text-critical",
  warning: "text-warning",
  success: "text-success",
  neutral: "text-text-2",
};
export const toneDot: Record<ScoreTone, string> = {
  critical: "bg-dot-flag",
  warning: "bg-dot-warn",
  success: "bg-dot-ok",
  neutral: "bg-text/25",
};
const toneStroke: Record<ScoreTone, string> = {
  critical: "rgb(var(--dot-flag))",
  warning: "rgb(var(--dot-warn))",
  success: "rgb(var(--dot-ok))",
  neutral: "rgb(var(--line))",
};

export function ScoreText({ value, className, digits = 2 }: { value: number | null | undefined; className?: string; digits?: number }) {
  const tone = scoreTone(value);
  return <span className={cn("num font-mono font-medium", toneText[tone], className)}>{fmtScore(value, digits)}</span>;
}

/** Score chip: subtle pill, tone dot, mono number. */
export function ScorePill({ value, className }: { value: number | null | undefined; className?: string }) {
  const tone = scoreTone(value);
  return (
    <span className={cn("num inline-flex min-w-[70px] items-center justify-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[13px] font-medium leading-[18px]", tone === "critical" ? "bg-critical/10 text-critical" : "bg-surface-2 text-text", className)}>
      <span className={cn("dot", toneDot[tone])} />
      {fmtScore(value)}
    </span>
  );
}

export function ScoreRing({ value, original, size = 120, label }: { value: number | null | undefined; original?: number | null; size?: number; label?: string }) {
  const tone = scoreTone(value);
  const sw = Math.max(6, Math.round(size / 14));
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value ?? 0)) / 100;
  const differs = original !== undefined && original !== null && value !== null && value !== undefined && Math.abs(original - value) > 0.004;
  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--surface-2))" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={toneStroke[tone]} strokeWidth={sw} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 600ms ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ height: size }}>
        <span className="num font-display font-semibold leading-none tracking-[-0.03em] text-text" style={{ fontSize: size * 0.24 }}>
          {fmtScore(value)}
        </span>
        {differs ? <span className="num mt-1 font-mono text-[11px] text-text-2 line-through">{fmtScore(original)}</span> : null}
      </div>
      {label ? <span className="label mt-2">{label}</span> : null}
    </div>
  );
}

export function ReviewBadge({ state }: { state: ReviewState | string | null | undefined }) {
  const { t } = useTranslation();
  if (!state || state === "none") return <span className="text-text-2">—</span>;
  const variant = state === "under_review" ? "warning" : state === "changed" ? "info" : state === "confirmed" || state === "reviewed" ? "success" : "neutral";
  return <Badge variant={variant}>{t(`reviewState.${state}` as never, { defaultValue: state })}</Badge>;
}

export function ProviderBadge({ provider, mode, model, className }: { provider: string | null | undefined; mode?: string | null; model?: string | null; className?: string }) {
  const { t } = useTranslation();
  if (!provider) return <span className="text-text-2">—</span>;
  const name = t(`provider.${provider}` as never, { defaultValue: provider });
  const m = model ? model.replace(/^anthropic:/, "") : null;
  const modeLabel = mode ? t(`mode.${mode}` as never, { defaultValue: mode }) : null;
  return (
    <Badge variant={provider === "ensemble" ? "accent" : "neutral"} className={className} title={m ?? undefined}>
      {name}
      {modeLabel && mode !== "single" ? <span className="text-text-2">· {modeLabel}</span> : null}
    </Badge>
  );
}

export function ConfidenceBar({ value, className }: { value: number | null | undefined; className?: string }) {
  const v = Math.max(0, Math.min(1, value ?? 0));
  const tone = v >= 0.8 ? "bg-dot-ok" : v >= 0.6 ? "bg-dot-warn" : "bg-dot-flag";
  return (
    <div className={cn("flex items-center gap-2", className)} title={`${Math.round(v * 100)}%`}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${v * 100}%` }} />
      </div>
      <span className="num font-mono text-[11px] text-text-2">{Math.round(v * 100)}%</span>
    </div>
  );
}

export function AnswerLabel({ answer, applicable, answerType }: { answer: string | number | null | undefined; applicable?: boolean; answerType?: string }) {
  const { t } = useTranslation();
  if (applicable === false || answer === null || answer === undefined) return <span className="font-mono text-text-2">{t("common.na")}</span>;
  if (answerType === "scale" || typeof answer === "number" || /^\d+(\.\d+)?$/.test(String(answer))) return <span className="num font-mono font-medium">{String(answer)}</span>;
  const a = String(answer).toLowerCase();
  if (a === "yes")
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-text">
        <span className="dot bg-dot-ok" />
        {t("common.yes")}
      </span>
    );
  if (a === "no")
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-critical">
        <span className="dot bg-dot-flag" />
        {t("common.no")}
      </span>
    );
  if (a === "na" || a === "n/a") return <span className="font-mono text-text-2">{t("common.na")}</span>;
  return <span>{String(answer)}</span>;
}

/** `mascot` is accepted for backwards compatibility and ignored: the white theme has no mascot. */
export function EmptyState({ title, hint, icon, action, className }: { title: string; hint?: string; icon?: React.ReactNode; action?: React.ReactNode; className?: string; mascot?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-14 text-center", className)}>
      <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-surface-2 text-text [&_svg]:size-6">{icon ?? <Inbox />}</div>
      <div className="font-display text-h3">{title}</div>
      {hint ? <div className="max-w-sm text-caption text-text-2">{hint}</div> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={cn("flex items-center gap-3 rounded-md bg-critical/[0.07] px-4 py-3 text-caption", className)}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-critical">
        <AlertTriangle className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-critical">{t("common.error")}</div>
        <div className="text-text-2">{errorMessage(error)}</div>
      </div>
      {onRetry ? (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          <RefreshCw /> {t("common.retry")}
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingBlock({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

/**
 * Title goes to the shell's top bar (crumb + 26px title). The page keeps a row with the
 * subtitle on the left and the actions on the right. Without a shell (embed) it renders inline.
 */
export function PageHeader({ title, subtitle, actions, crumb, className }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; crumb?: React.ReactNode; className?: string }) {
  const { t } = useTranslation();
  const slot = useTitleSlot();
  return (
    <>
      <PageTitle crumb={crumb ?? `${t("app.name")} · ${t("app.by")}`} title={title} />
      {slot && !subtitle && !actions ? null : (
        <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
          <div className="min-w-0">
            {!slot ? <h1 className="font-display text-h2">{title}</h1> : null}
            {subtitle ? <div className="text-caption text-text-2">{subtitle}</div> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      )}
    </>
  );
}

/** White 24px card with a Card/Title header (17px semibold), as in the kit's table card. */
export function Section({ title, right, children, className, bodyClassName }: { title?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      {title !== undefined ? (
        <header className="flex min-h-[60px] items-center justify-between gap-3 px-5 py-3">
          <h2 className="font-display text-h3">{title}</h2>
          {right}
        </header>
      ) : null}
      <div className={cn(title !== undefined ? "px-5 pb-5" : "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function KeyValue({ k, v, mono }: { k: React.ReactNode; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
      <span className="text-caption text-text-2">{k}</span>
      <span className={cn("text-caption", mono && "num font-mono")}>{v}</span>
    </div>
  );
}

export function JsonView({ value, maxHeight = 320, className, defaultOpen = false, title }: { value: unknown; maxHeight?: number; className?: string; defaultOpen?: boolean; title?: React.ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(defaultOpen);
  const text = React.useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);
  return (
    <div className={cn("overflow-hidden border-t border-line", className)}>
      <div className="flex items-center justify-between py-1.5">
        <button type="button" className="flex items-center gap-1.5 text-caption font-medium text-text hover:text-text" onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          <span>{title ?? "JSON"}</span>
          <span className="num font-mono text-[11px] text-text-2">{text.length.toLocaleString()} b</span>
        </button>
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            if (await copyText(text)) notify(t("common.copied"));
          }}
        >
          {t("common.copy")}
        </Button>
      </div>
      {open ? (
        <pre className="mb-3 overflow-auto whitespace-pre-wrap break-words border-l-2 border-line py-1 pl-4 pr-2 font-mono text-[12px] leading-[18px] text-text" style={{ maxHeight }}>
          {text}
        </pre>
      ) : null}
    </div>
  );
}

/** Stat tile: mono label, 32px number, one-line caption. */
export function Kpi({ label, value, hint, tone, flat }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: ScoreTone; flat?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-2", flat ? "border-l border-line px-4 py-1" : "rounded-md border border-line bg-surface p-5")}>
      <div className="label flex items-center gap-1.5">
        {tone && tone !== "neutral" ? <span className={cn("dot", toneDot[tone])} /> : null}
        {label}
      </div>
      <div className="num font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-text">{value}</div>
      {hint ? <div className="text-small text-text-2">{hint}</div> : null}
    </div>
  );
}
