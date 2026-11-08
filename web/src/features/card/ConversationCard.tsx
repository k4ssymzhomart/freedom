import * as React from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Copy, FileDown, Mic, RefreshCw } from "lucide-react";
import { useAudioFeatures, useConversation, useInvalidateConversation, useLatestEvaluation } from "@/api/queries";
import type { EvaluationCriterion, Evidence, Turn } from "@/api/types";
import { apiUrl } from "@/lib/config";
import { copyText } from "@/lib/utils";
import { fmtSeconds } from "@/lib/format";
import { notify } from "@/lib/toast";
import { useUi } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, LoadingBlock, ReviewBadge } from "@/components/common";
import { PageTitle, useTitleSlot } from "@/components/chrome";
import { Transcript, type TranscriptHandle } from "./Transcript";
import { AudioPlayer, type AudioHandle } from "./AudioPlayer";
import { EvaluationPanel } from "./EvaluationPanel";
import { HistoryTab } from "./HistoryTab";
import { TraceTab } from "./TraceTab";
import { AudioInsightsTab } from "./AudioInsightsTab";
import { AppealDialog } from "./AppealDialog";
import { EvaluateDialog } from "@/features/conversations/EvaluateDialog";
import { JobProgress } from "@/features/jobs/JobProgress";

export function ConversationCard({ id, embed = false, onBack }: { id: string; embed?: boolean; onBack?: () => void }) {
  const { t } = useTranslation();
  const { role } = useUi();
  const conv = useConversation(id);
  const evaluation = useLatestEvaluation(id);
  const hasAudio = !!conv.data?.has_audio;
  const features = useAudioFeatures(id, hasAudio);
  const invalidate = useInvalidateConversation();

  const transcript = React.useRef<TranscriptHandle>(null);
  const audio = React.useRef<AudioHandle>(null);
  const [activeTurn, setActiveTurn] = React.useState<number | null>(null);
  const [activeSpan, setActiveSpan] = React.useState<{ from: number; to: number } | null>(null);
  const [appealFor, setAppealFor] = React.useState<EvaluationCriterion | null>(null);
  const [reEvalOpen, setReEvalOpen] = React.useState(false);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState("result");
  const slot = useTitleSlot();

  const evidenceTurns = React.useMemo(() => {
    const s = new Set<number>();
    evaluation.data?.criteria?.forEach((c) => c.evidence?.forEach((e) => s.add(e.turn_idx)));
    return s;
  }, [evaluation.data]);

  const markers = React.useMemo(() => {
    const m: number[] = [];
    evaluation.data?.criteria?.forEach((c) => c.evidence?.forEach((e) => e.offset_seconds != null && m.push(e.offset_seconds)));
    return m;
  }, [evaluation.data]);

  const jumpToTurn = (idx: number, offset?: number | null) => {
    setActiveSpan(null);
    setActiveTurn(idx);
    transcript.current?.scrollToTurn(idx);
    if (hasAudio && offset != null) audio.current?.seek(offset, true);
  };
  const onEvidence = (e: Evidence) => {
    const turn = conv.data?.turns.find((x) => x.idx === e.turn_idx);
    jumpToTurn(e.turn_idx, e.offset_seconds ?? turn?.offset_seconds ?? null);
  };
  const onSpan = (span: { from: number; to: number } | null) => {
    setActiveTurn(null);
    setActiveSpan(span);
    if (span) transcript.current?.scrollToTurn(span.from);
  };
  const onTurnClick = (turn: Turn) => {
    if (hasAudio && turn.offset_seconds != null) audio.current?.seek(turn.offset_seconds, true);
    setActiveTurn(turn.idx);
    setActiveSpan(null);
  };

  const ev = evaluation.data ?? null;
  const running = conv.data?.latest_evaluation && ["running", "queued"].includes(conv.data.latest_evaluation.status);

  if (conv.isLoading) return <LoadingBlock rows={8} className="px-8 py-7" />;
  if (conv.error) return <ErrorState error={conv.error} onRetry={() => conv.refetch()} className="mx-8 my-7" />;
  const c = conv.data!;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageTitle crumb={t("nav.conversations")} title={<span className="font-mono tracking-[-0.03em]">{c.id}</span>} />
      <header className="flex shrink-0 flex-wrap items-center gap-3 px-8 pb-4 pt-6">
        {!embed ? (
          <Button variant="secondary" size="icon" onClick={onBack} aria-label={t("common.back")}>
            <ArrowLeft />
          </Button>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {!slot ? <span className="mr-1 font-mono text-h3">{c.id}</span> : null}
          <Badge variant="outline">
            {c.channel === "voice call" ? <Mic className="size-3" /> : null}
            {t(`channel.${c.channel}` as never, { defaultValue: c.channel })}
          </Badge>
          <Badge variant="mono">{c.language}</Badge>
          {c.operator_name ? <span className="text-caption font-medium">{c.operator_name}</span> : null}
          <span className="num px-1 font-mono text-[12px] text-text-2">
            {c.turn_count} {t("common.turns").toLowerCase()} · {t("conversations.columns.firstResponse")} {fmtSeconds(c.first_response_seconds)}
          </span>
          <ReviewBadge state={c.review_state} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {ev ? (
            <>
              <Button variant="secondary" size="sm" asChild>
                <a href={apiUrl(`/api/export/evaluations/${ev.id}.pdf`)} target="_blank" rel="noreferrer">
                  <FileDown /> {t("common.exportPdf")}
                </a>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  if (await copyText(JSON.stringify(ev, null, 2))) notify(t("common.copied"));
                }}
              >
                <Copy /> {t("common.copyJson")}
              </Button>
            </>
          ) : null}
          {role === "analyst" ? (
            <Button variant="primary" size="sm" onClick={() => setReEvalOpen(true)} disabled={!!jobId && !running}>
              <RefreshCw /> {ev ? t("card.reEvaluate") : t("conversations.evaluate")}
            </Button>
          ) : null}
        </div>
      </header>

      {jobId ? (
        <div className="shrink-0 px-8 pb-4">
          <JobProgress
            jobId={jobId}
            compact
            onDone={() => invalidate(id)}
            onDismiss={() => setJobId(null)}
          />
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-8 pb-6 lg:grid-cols-[minmax(360px,5fr)_minmax(420px,7fr)]">
        <section className="card flex min-h-[480px] flex-col overflow-hidden lg:min-h-0">
          <div className="flex min-h-[60px] items-center justify-between px-5 py-3">
            <h2 className="font-display text-h3">{t("card.transcript")}</h2>
            {c.meta?.operator_start_idx != null ? <span className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-text-2">operator_start [{c.meta.operator_start_idx + 1}]</span> : null}
          </div>
          {hasAudio ? <AudioPlayer ref={audio} conversationId={id} features={features.data ?? null} markers={markers} /> : null}
          <Transcript ref={transcript} turns={c.turns} activeTurn={activeTurn} activeSpan={activeSpan} evidenceTurns={evidenceTurns} onTurnClick={onTurnClick} hasAudio={hasAudio} />
        </section>

        <section className="card flex min-h-[480px] flex-col overflow-hidden lg:min-h-0">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-5 py-3">
              <h2 className="font-display text-h3">{t("card.verdict")}</h2>
              <TabsList>
                <TabsTrigger value="result">{t("card.tabs.result")}</TabsTrigger>
                <TabsTrigger value="history">{t("card.tabs.history")}</TabsTrigger>
                <TabsTrigger value="trace">{t("card.tabs.trace")}</TabsTrigger>
                <TabsTrigger value="audio">{t("card.tabs.audio")}</TabsTrigger>
              </TabsList>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto border-t border-line bg-bg/60 p-5">
              <TabsContent value="result">
                {evaluation.isLoading ? (
                  <LoadingBlock rows={6} />
                ) : evaluation.error ? (
                  <ErrorState error={evaluation.error} onRetry={() => evaluation.refetch()} />
                ) : ev ? (
                  <EvaluationPanel evaluation={ev} onEvidence={onEvidence} onSpan={onSpan} canAppeal={role === "analyst" && !embed} onAppeal={setAppealFor} hasAudio={hasAudio} />
                ) : (
                  <EmptyState
                    title={running ? t("status.running") : t("card.noEvaluation")}
                    hint={t("card.noEvaluationHint")}
                    action={
                      role === "analyst" && !running ? (
                        <Button variant="primary" onClick={() => setReEvalOpen(true)}>
                          {t("conversations.evaluate")}
                        </Button>
                      ) : undefined
                    }
                  />
                )}
              </TabsContent>
              <TabsContent value="history">
                <HistoryTab conversationId={id} current={ev} />
              </TabsContent>
              <TabsContent value="trace">
                <TraceTab evaluation={ev} />
              </TabsContent>
              <TabsContent value="audio">
                <AudioInsightsTab features={features.data} hasAudio={hasAudio} onSeek={(s) => audio.current?.seek(s, true)} />
              </TabsContent>
            </div>
          </Tabs>
        </section>
      </div>

      <AppealDialog criterion={appealFor} open={!!appealFor} onOpenChange={(o) => !o && setAppealFor(null)} onCreated={() => invalidate(id)} />
      <EvaluateDialog
        open={reEvalOpen}
        onOpenChange={setReEvalOpen}
        conversationIds={[id]}
        allowScopeAll={false}
        defaultVersionId={ev?.checklist_version_id ?? null}
        title={t("card.reEvaluate")}
        onStarted={(jid) => {
          setJobId(jid);
          notify(t("card.reEvaluating"));
        }}
      />
    </div>
  );
}
