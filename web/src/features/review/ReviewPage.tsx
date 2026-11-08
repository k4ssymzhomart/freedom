import * as React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ExternalLink } from "lucide-react";
import { api } from "@/api/endpoints";
import { useAppeals } from "@/api/queries";
import type { AppealWithContext } from "@/api/types";
import { answerText, fmtDate, fmtScore, truncate } from "@/lib/format";
import { dateLocale } from "@/i18n";
import { cn } from "@/lib/utils";
import { notify, notifyError } from "@/lib/toast";
import { useUi } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Segmented } from "@/components/ui/tabs";
import { AnswerLabel, EmptyState, ErrorState, LoadingBlock, PageHeader, ScorePill } from "@/components/common";

export default function ReviewPage() {
  const { t } = useTranslation();
  const appeals = useAppeals();
  const items = appeals.data ?? [];
  const open = items.filter((a) => a.status === "open");
  const decided = items.filter((a) => a.status !== "open");

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <PageHeader title={t("review.title")} subtitle={t("review.subtitle")}  />
      {appeals.isLoading ? (
        <LoadingBlock rows={4} />
      ) : appeals.error ? (
        <ErrorState error={appeals.error} onRetry={() => appeals.refetch()} />
      ) : (
        <>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-h3">{t("review.open")}</h2>
            <span className="num min-w-[24px] rounded-full bg-surface-2 px-2 py-0.5 text-center font-mono text-[12px]">{open.length}</span>
          </div>
          {open.length === 0 ? <EmptyState title={t("review.empty")} /> : open.map((a) => <AppealCard key={a.id} a={a} />)}
          <div className="mt-4 flex items-center gap-2.5">
            <h2 className="font-display text-h3">{t("review.decided")}</h2>
            <span className="num min-w-[24px] rounded-full bg-surface-2 px-2 py-0.5 text-center font-mono text-[12px]">{decided.length}</span>
          </div>
          {decided.length === 0 ? <EmptyState title={t("review.emptyDecided")} className="py-8" /> : decided.map((a) => <AppealCard key={a.id} a={a} />)}
        </>
      )}
    </div>
  );
}

const NA = "__na__";

function AppealCard({ a }: { a: AppealWithContext }) {
  const { t } = useTranslation();
  const { role } = useUi();
  const qc = useQueryClient();
  const isOpen = a.status === "open";
  const [action, setAction] = React.useState<"confirm" | "change">("confirm");
  const [answer, setAnswer] = React.useState<string>("");
  const [reason, setReason] = React.useState("");
  const [fewshot, setFewshot] = React.useState(true);
  const [preview, setPreview] = React.useState<number | null>(null);
  const [previewing, setPreviewing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const newAnswerValue = (): string | number | null => {
    if (answer === NA) return null;
    const opt = a.options.find((o) => String(o.value) === answer);
    return opt ? opt.value : answer;
  };

  React.useEffect(() => {
    if (!isOpen || action !== "change" || !answer) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewing(true);
    api
      .preview({ evaluation_criterion_id: a.evaluation_criterion_id, new_answer: newAnswerValue() })
      .then((r) => !cancelled && setPreview(r.final_total_score))
      .catch(() => !cancelled && setPreview(null))
      .finally(() => !cancelled && setPreviewing(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, answer, a.evaluation_criterion_id, isOpen]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.decide(a.id, { action, new_answer: action === "change" ? newAnswerValue() : null, reason: reason.trim(), reviewer_label: t("role.reviewer"), add_to_fewshot: fewshot });
      notify(t("review.saved", { total: fmtScore(res.evaluation?.final_total_score ?? preview) }));
      void qc.invalidateQueries({ queryKey: ["appeals"] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
      void qc.invalidateQueries({ queryKey: ["evaluation", a.conversation_id] });
      void qc.invalidateQueries({ queryKey: ["evaluations", a.conversation_id] });
      void qc.invalidateQueries({ queryKey: ["analytics"] });
    } catch (e) {
      notifyError(e);
    } finally {
      setSaving(false);
    }
  };

  const evidence = a.evidence?.find((e) => e.role === "supports") ?? a.evidence?.[0];

  return (
    <div className={cn("card grid grid-cols-1 gap-0 overflow-hidden", isOpen ? "lg:grid-cols-[1fr_380px]" : "")}>
      <div className="flex flex-col gap-3.5 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/conversations/${encodeURIComponent(a.conversation_id)}`} className="inline-flex items-center gap-1.5 font-mono text-caption font-medium underline-offset-4 hover:underline">
            {a.conversation_id} <ExternalLink className="size-3" />
          </Link>
          {a.language ? <Badge variant="mono">{a.language}</Badge> : null}
          {a.channel ? <Badge variant="outline">{t(`channel.${a.channel}` as never, { defaultValue: a.channel })}</Badge> : null}
          <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-medium">{a.code}</span>
          <span className="min-w-0 text-body font-semibold">{a.title}</span>
          <span className="ml-auto shrink-0 font-mono text-[11px] text-text-2">{fmtDate(a.created_at, dateLocale())}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-caption">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-text-2">{t("review.originalAnswer")}:</span>
            <AnswerLabel answer={a.answer} applicable={a.applicable} answerType={a.answer_type} />
            <span className="num font-mono text-text-2">
              {fmtScore(a.score, 0)}/{fmtScore(a.max_points, 0)} · {t("common.weight").toLowerCase()} {fmtScore(a.weight, 0)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-text-2">{t("common.total")}:</span>
            <ScorePill value={a.total_score} />
            {a.final_total_score !== null && a.final_total_score !== a.total_score ? (
              <>
                <ArrowRight className="size-3 text-text-2" /> <ScorePill value={a.final_total_score} />
              </>
            ) : null}
          </span>
        </div>
        <p className="text-[14px] leading-[1.55] text-text-2">{a.explanation}</p>
        {evidence ? (
          <div className="border-l-2 border-brand pl-4 font-mono text-[12px] leading-[1.6]">
            <span className="num mr-2 text-text-2">[{evidence.turn_idx + 1}]</span>
            <span className="font-sans">{truncate(evidence.quote, 240)}</span>
          </div>
        ) : null}
        <div className="border-l-2 border-dot-warn pl-4 text-caption">
          <div className="mb-1 flex items-center justify-between">
            <span className="label">{t("review.comment")}</span>
            <span className="text-[11px] text-text-2">{a.author_label}</span>
          </div>
          {a.comment}
        </div>
        {a.decision ? (
          <div className={cn("border-l-2 pl-4 text-caption", a.decision.action === "confirm" ? "border-brand" : "border-line-strong/40")}>
            <div className="mb-1 flex items-center justify-between">
              <span className="label">{t("review.decision")}</span>
              <span className="text-[11px] text-text-2">
                {t("review.by", { name: a.decision.reviewer_label })} · {fmtDate(a.decision.created_at, dateLocale())}
              </span>
            </div>
            <div className="font-medium">
              {a.decision.action === "confirm" ? t("card.history.confirmed") : t("card.history.changedTo", { answer: answerText(a.decision.new_answer, t) })}
              {a.decision.new_score !== null && a.decision.action === "change" ? <span className="num ml-1 font-mono text-text-2">({a.decision.new_score} / {a.max_points})</span> : null}
            </div>
            <div className="text-text-2">{a.decision.reason}</div>
          </div>
        ) : null}
      </div>

      {isOpen ? (
        <div className="flex flex-col gap-4 border-t border-line bg-bg p-6 lg:border-l lg:border-t-0">
          <h3 className="font-display text-h3">{t("review.decision")}</h3>
          {role !== "reviewer" ? <div className="flex items-center gap-2 border-t border-line pt-4 text-caption text-text"><span className="dot bg-dot-warn" />{t("review.reviewerOnly")}</div> : null}
          <Segmented
            value={action}
            onChange={setAction}
            disabled={role !== "reviewer"}
            className="w-fit bg-surface-2"
            options={(["confirm", "change"] as const).map((x) => ({ value: x, label: t(`review.${x}`) }))}
          />
          {action === "change" ? (
            <div className="flex flex-col gap-1.5">
              <Label>{t("review.newAnswer")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {a.options.map((o) => (
                  <button
                    key={String(o.value)}
                    type="button"
                    disabled={role !== "reviewer"}
                    onClick={() => setAnswer(String(o.value))}
                    className={cn("h-9 rounded-full border px-3.5 font-mono text-caption transition-colors disabled:opacity-60", answer === String(o.value) ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface hover:border-line-strong/40")}
                    title={o.anchor ?? undefined}
                  >
                    {o.label} <span className="opacity-60">· {o.points}</span>
                  </button>
                ))}
                {a.na_allowed ? (
                  <button type="button" disabled={role !== "reviewer"} onClick={() => setAnswer(NA)} className={cn("h-9 rounded-full border px-3.5 font-mono text-caption disabled:opacity-60", answer === NA ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface hover:border-line-strong/40")}>
                    {t("common.na")}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label>{t("review.reason")}</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("review.reasonPlaceholder")} disabled={role !== "reviewer"} className="min-h-[72px]" />
          </div>
          <label className="flex items-center gap-2 text-caption">
            <Switch checked={fewshot} onCheckedChange={setFewshot} disabled={role !== "reviewer"} /> {t("review.fewshot")}
          </label>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <div>
              <div className="text-caption text-text-2">{t("review.preview")}</div>
              <div className="text-[11px] text-text-2">{t("review.previewHint")}</div>
            </div>
            <div className="flex items-center gap-2">
              <ScorePill value={a.total_score} />
              <ArrowRight className="size-3 text-text-2" />
              {previewing ? <span className="text-caption text-text-2">…</span> : <ScorePill value={action === "confirm" ? a.total_score : preview} />}
            </div>
          </div>
          <Button variant="primary" size="lg" onClick={save} loading={saving} disabled={role !== "reviewer" || !reason.trim() || (action === "change" && !answer)}>
            {t("review.save")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
