import * as React from "react";
import { useTranslation } from "react-i18next";
import { AlertOctagon, ChevronDown, ChevronRight, Flag, Link2, MessageSquareWarning } from "lucide-react";
import type { EvaluationCriterion, Evidence } from "@/api/types";
import { cn } from "@/lib/utils";
import { answerText, fmtScore, fmtSeconds, truncate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hint } from "@/components/ui/misc";
import { AnswerLabel, ConfidenceBar } from "@/components/common";

export interface CriterionRowProps {
  c: EvaluationCriterion;
  onEvidence: (e: Evidence) => void;
  onSpan: (span: { from: number; to: number } | null) => void;
  canAppeal: boolean;
  onAppeal: (c: EvaluationCriterion) => void;
  hasAudio?: boolean;
  defaultOpen?: boolean;
}

export function CriterionRow({ c, onEvidence, onSpan, canAppeal, onAppeal, hasAudio, defaultOpen = true }: CriterionRowProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(defaultOpen);
  const na = !c.applicable;
  const changed = c.review_state === "changed";
  const confirmed = c.review_state === "confirmed";
  const underReview = c.review_state === "under_review" || c.appeal?.status === "open";
  const isFlag = c.max_points === 0 || c.weight === 0;
  const critical = isFlag && String(c.answer).toLowerCase() === "yes";
  const finalScore = changed ? c.final_score : c.score;
  const finalEarned = changed ? c.final_earned : c.earned;

  return (
    <div className={cn("overflow-hidden rounded-md border border-line bg-surface transition-colors", critical && "border-critical/40", underReview && "border-dot-warn")}>
      <div className={cn("flex items-start gap-3 px-5 py-4", na && "opacity-75")}>
        <button type="button" className="mt-0.5 flex size-6 items-center justify-center rounded-full text-text-2 hover:bg-surface-2 hover:text-text" onClick={() => setOpen((o) => !o)} aria-label={open ? t("common.collapse") : t("common.expand")}>
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-medium">{c.code}</span>
            <span className="text-body font-semibold tracking-[-0.005em]">{c.title}</span>
            {critical ? (
              <Badge variant="critical">
                <AlertOctagon className="size-3" /> {t("common.critical")}
              </Badge>
            ) : null}
            {underReview ? <Badge variant="warning">{t("reviewState.under_review")}</Badge> : null}
            {changed ? <Badge variant="info">{t("reviewState.changed")}</Badge> : null}
            {confirmed ? <Badge variant="success">{t("reviewState.confirmed")}</Badge> : null}
            {na ? <Badge variant="outline">{t("common.na")}</Badge> : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-caption">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-text-2">{t("common.score")}:</span>
              {changed ? (
                <>
                  <span className="line-through opacity-60">
                    <AnswerLabel answer={c.answer} applicable={c.applicable || c.answer !== null} answerType={c.answer_type} />
                  </span>
                  <span className="text-text-2">→</span>
                  <AnswerLabel answer={c.final_answer} applicable={c.final_answer !== null} answerType={c.answer_type} />
                </>
              ) : (
                <AnswerLabel answer={c.answer} applicable={c.applicable} answerType={c.answer_type} />
              )}
            </span>
            {!isFlag ? (
              <span className="num font-mono">
                {changed ? <span className="line-through opacity-60">{fmtScore(c.score, 0)}</span> : null} {na ? "—" : fmtScore(finalScore, 0)}
                <span className="text-text-2"> / {fmtScore(c.max_points, 0)}</span>
              </span>
            ) : (
              <span className="text-text-2">{t("card.grossBannerHint").split(":")[0]}</span>
            )}
            {!isFlag ? (
              <span className="num font-mono text-text-2">
                {t("common.weight")} {fmtScore(c.weight, 0)}
                {Math.abs(c.weight_applied - c.weight) > 0.001 ? <span className="text-brand-ink"> → {fmtScore(c.weight_applied, 2)}</span> : null}
                {!na ? <span> · {fmtScore(finalEarned, 2)}</span> : null}
              </span>
            ) : null}
            <ConfidenceBar value={c.confidence} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {canAppeal ? (
            <Hint label={c.appeal?.status === "open" ? t("card.appealOpen") : undefined}>
              <span>
                <Button size="sm" variant="secondary" disabled={c.appeal?.status === "open"} onClick={() => onAppeal(c)}>
                  <MessageSquareWarning /> {t("card.appeal")}
                </Button>
              </span>
            </Hint>
          ) : null}
        </div>
      </div>
      {open ? (
        <div className="flex flex-col gap-3 border-t border-line px-5 py-4 pl-14">
          {na && c.na_reason ? (
            <div className="rounded-[12px] bg-bg px-3.5 py-2.5 text-caption">
              <span className="label mr-2">{t("card.naReason")}</span>
              <span className="text-text-2">{c.na_reason}</span>
            </div>
          ) : null}
          <p className="text-[14px] leading-[1.55] text-text">{c.explanation}</p>
          {c.evidence?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {c.evidence.map((e, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onEvidence(e)}
                  className={cn(
                    "group inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-left font-mono text-[11px] leading-4 text-text-2 transition-colors hover:border-line-strong/40",
                    e.role === "contradicts" ? "border-critical/30 bg-critical/[0.06]" : e.role === "context" ? "border-line bg-surface" : "border-transparent bg-accent-subtle",
                  )}
                  title={`${t(`card.evidenceRole.${e.role}` as never, { defaultValue: e.role })} · ${e.speaker}`}
                >
                  <span className={cn("dot", e.role === "contradicts" ? "bg-dot-flag" : e.role === "context" ? "bg-text/25" : "bg-dot-ok")} />
                  <span className="num shrink-0">[{e.turn_idx + 1}]</span>
                  <span className="truncate font-sans text-[12px] text-text">{truncate(e.quote, 90)}</span>
                  {hasAudio && e.offset_seconds != null ? <span className="num shrink-0 opacity-70">{fmtSeconds(e.offset_seconds)}</span> : null}
                  <Link2 className="size-3 shrink-0 opacity-50 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          ) : null}
          {c.checked_span ? (
            <button type="button" className="inline-flex w-fit items-center gap-2 rounded-full bg-dot-warn/15 px-3 py-1 text-[12px] font-medium text-text hover:bg-dot-warn/25" onClick={() => onSpan(c.checked_span ? { from: c.checked_span.from_turn, to: c.checked_span.to_turn } : null)}>
              <span className="inline-block h-3 w-[3px] rounded-full bg-dot-warn" /> {t("card.checkedSpan", { from: c.checked_span.from_turn + 1, to: c.checked_span.to_turn + 1 })}
            </button>
          ) : null}
          {c.flags?.length ? (
            <div className="flex flex-wrap items-center gap-1">
              <Flag className="size-3 text-text-2" />
              {c.flags.map((f) => (
                <Badge key={f} variant="outline" className="font-mono text-[10px]">
                  {f}
                </Badge>
              ))}
            </div>
          ) : null}
          {c.votes?.length ? (
            <div className="rounded-[12px] bg-bg px-3.5 py-3">
              <div className="label mb-2">{t("card.votes")}</div>
              <div className="flex flex-wrap gap-2">
                {c.votes.map((v, i) => (
                  <Badge key={i} variant={v.answer === c.answer ? "accent" : "warning"} className="font-mono">
                    {v.model.replace(/^anthropic:/, "")}: {String(v.answer ?? "—")}
                    {v.confidence != null ? ` · ${Math.round(v.confidence * 100)}%` : ""}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {c.claims?.length ? (
            <div className="rounded-[12px] bg-bg px-3.5 py-3">
              <div className="label mb-2">{t("card.claims")}</div>
              <ul className="flex flex-col gap-1 text-[12px]">
                {c.claims.map((cl, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge variant={cl.status === "verified" ? "success" : cl.status === "contradicted" || cl.status === "false" ? "critical" : "outline"} className="shrink-0 font-mono text-[10px]">
                      {cl.status}
                    </Badge>
                    <span>
                      <button type="button" className="num mr-1 font-mono text-text-2 underline-offset-2 hover:text-text hover:underline" onClick={() => onEvidence({ turn_idx: cl.turn_idx, speaker: "operator", quote: cl.claim, role: "context" })}>
                        [{cl.turn_idx + 1}]
                      </button>
                      {cl.claim}
                      {cl.note ? <span className="text-text-2"> — {cl.note}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {c.appeal ? (
            <div className={cn("rounded-[12px] px-3.5 py-3 text-caption", c.appeal.status === "open" ? "bg-dot-warn/15" : "bg-surface-2")}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{c.appeal.status === "open" ? t("card.appealOpen") : t("card.appealDecided")}</span>
                <span className="text-[11px] text-text-2">{c.appeal.author_label}</span>
              </div>
              <div className="mt-0.5 text-text-2">{c.appeal.comment}</div>
              {c.appeal.decision ? (
                <div className="mt-2 border-t border-text/10 pt-2">
                  <span className="font-medium">{c.appeal.decision.action === "confirm" ? t("card.history.confirmed") : t("card.history.changedTo", { answer: answerText(c.appeal.decision.new_answer, t) })}</span>
                  <span className="text-text-2"> — {c.appeal.decision.reason}</span>
                  <span className="ml-1 text-[11px] text-text-2">· {c.appeal.decision.reviewer_label}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
