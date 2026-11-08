import * as React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, MessageSquareWarning, Scale } from "lucide-react";
import { api } from "@/api/endpoints";
import { useEvaluationHistory } from "@/api/queries";
import type { Evaluation } from "@/api/types";
import { answerText, fmtDate, fmtMoney, fmtScore } from "@/lib/format";
import { dateLocale } from "@/i18n";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AnswerLabel, EmptyState, ErrorState, LoadingBlock, ProviderBadge, ReviewBadge, ScorePill } from "@/components/common";

export function HistoryTab({ conversationId, current }: { conversationId: string; current: Evaluation | null }) {
  const { t } = useTranslation();
  const history = useEvaluationHistory(conversationId);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const activeId = selectedId ?? current?.id ?? history.data?.[0]?.id ?? null;
  const detail = useQuery({
    queryKey: ["evaluation-detail", activeId],
    queryFn: () => api.getEvaluation(activeId!),
    enabled: !!activeId && activeId !== current?.id,
  });
  const active: Evaluation | null = activeId === current?.id ? current : detail.data ?? null;

  if (history.isLoading) return <LoadingBlock rows={4} />;
  if (history.error) return <ErrorState error={history.error} onRetry={() => history.refetch()} />;
  const items = history.data ?? [];
  if (items.length === 0) return <EmptyState title={t("card.history.empty")} />;

  const timeline = (active?.criteria ?? [])
    .map((c) => ({ c, appeals: c.appeals?.length ? c.appeals : c.appeal ? [c.appeal] : [] }))
    .filter((x) => x.appeals.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="px-5 pb-2 pt-4">
          <h3 className="font-display text-h3">{t("card.history.title")}</h3>
        </div>
        <ul>
          {items.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setSelectedId(e.id)}
                className={cn("flex w-full flex-wrap items-center gap-3 border-t border-line px-5 py-3 text-left text-caption transition-colors hover:bg-bg", activeId === e.id && "bg-accent-subtle/60 hover:bg-accent-subtle/60")}
              >
                <span className="num font-mono text-text-2">#{e.id}</span>
                <span className="text-text-2">{fmtDate(e.completed_at ?? e.created_at, dateLocale())}</span>
                <ProviderBadge provider={e.provider} mode={e.mode} model={e.model} />
                <span className="text-text-2">v{e.checklist_version_id}</span>
                <span className="ml-auto flex items-center gap-2">
                  {e.total_score !== e.final_total_score ? <span className="num font-mono text-text-2 line-through">{fmtScore(e.total_score)}</span> : null}
                  <ScorePill value={e.final_total_score} />
                  {e.critical_error ? <Badge variant="critical">C8</Badge> : null}
                  <ReviewBadge state={e.review_state} />
                  <span className="num font-mono text-text-2">{fmtMoney(e.cost_usd, 3)}</span>
                  {e.id === current?.id ? <Badge variant="accent">{t("card.history.current")}</Badge> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border border-line bg-surface">
        <div className="px-5 pb-1 pt-4">
          <h3 className="flex items-center gap-2 font-display text-h3">
            {t("card.history.timeline")} {active ? <span className="num rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-normal text-text-2">#{active.id}</span> : null}
          </h3>
        </div>
        <div className="px-5 pb-5 pt-3">
          {detail.isLoading ? (
            <LoadingBlock rows={3} />
          ) : timeline.length === 0 ? (
            <div className="text-caption text-text-2">{t("card.history.noAppeals")}</div>
          ) : (
            <div className="flex flex-col gap-4">
              {timeline.map(({ c, appeals }) => (
                <div key={c.id} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-caption">
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-medium">{c.code}</span>
                    <span className="font-semibold">{c.title}</span>
                    <ReviewBadge state={c.review_state} />
                  </div>
                  <ol className="relative ml-3 flex flex-col gap-4 border-l-2 border-line pl-6">
                    <Step icon={<Scale className="size-3" />} title={t("card.history.original")} meta={fmtDate(active?.created_at, dateLocale())}>
                      <AnswerLabel answer={c.answer} applicable={c.applicable || c.answer !== null} answerType={c.answer_type} /> · {fmtScore(c.score, 0)}/{fmtScore(c.max_points, 0)} · {t("common.total")} {fmtScore(active?.total_score)}
                    </Step>
                    {appeals.map((a) => (
                      <React.Fragment key={a.id}>
                        <Step icon={<MessageSquareWarning className="size-3" />} title={t("card.history.appealBy", { author: a.author_label })} meta={fmtDate(a.created_at, dateLocale())} tone="warning">
                          {a.comment}
                        </Step>
                        {a.decision ? (
                          <Step icon={a.decision.action === "confirm" ? <Check className="size-3" /> : <ArrowRight className="size-3" />} title={t("card.history.decisionBy", { author: a.decision.reviewer_label })} meta={fmtDate(a.decision.created_at, dateLocale())} tone={a.decision.action === "confirm" ? "success" : "info"}>
                            <span className="font-medium">{a.decision.action === "confirm" ? t("card.history.confirmed") : t("card.history.changedTo", { answer: answerText(a.decision.new_answer, t) })}</span>
                            <span className="text-text-2"> — {a.decision.reason}</span>
                          </Step>
                        ) : null}
                      </React.Fragment>
                    ))}
                    {c.review_state === "changed" || c.review_state === "confirmed" ? (
                      <Step icon={<Check className="size-3" />} title={t("card.history.finalTotal")} tone="success">
                        <AnswerLabel answer={c.final_answer} applicable={c.final_answer !== null} answerType={c.answer_type} /> · {fmtScore(c.final_score, 0)}/{fmtScore(c.max_points, 0)} · {t("common.total")} <span className="num font-mono">{fmtScore(active?.final_total_score)}</span>
                      </Step>
                    ) : null}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ icon, title, meta, tone, children }: { icon: React.ReactNode; title: string; meta?: string; tone?: "warning" | "success" | "info"; children: React.ReactNode }) {
  const ring = tone === "warning" ? "bg-dot-warn text-text" : tone === "success" ? "bg-brand text-white" : tone === "info" ? "bg-dot-info text-white" : "bg-surface-2 text-text";
  return (
    <li className="relative">
      <span className={cn("absolute -left-[37px] top-0 flex size-6 items-center justify-center rounded-full ring-4 ring-surface", ring)}>{icon}</span>
      <div className="flex items-baseline gap-2 text-caption">
        <span className="font-medium">{title}</span>
        {meta ? <span className="text-small text-text-2">{meta}</span> : null}
      </div>
      <div className="mt-0.5 text-caption text-text">{children}</div>
    </li>
  );
}
