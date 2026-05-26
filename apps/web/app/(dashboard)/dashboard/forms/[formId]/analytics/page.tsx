"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { subDays, format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { trpc } from "~/trpc/client";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { TintCard, NumberTicker, Doodle, EditorialCard, EmptyState } from "~/components/chrome";

export default function AnalyticsPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const [startDate] = React.useState(() => subDays(new Date(), 30).toISOString());
  const [endDate] = React.useState(() => new Date().toISOString());
  const [selectedFieldId, setSelectedFieldId] = React.useState<string | null>(null);

  const { data: overview, isLoading: overviewLoading } =
    trpc.analytics.getOverview.useQuery({ formId }, { enabled: !!formId });

  const { data: dailyStats, isLoading: dailyLoading } =
    trpc.analytics.getDailyStats.useQuery(
      { formId, startDate, endDate },
      { enabled: !!formId },
    );

  const { data: dropoffs } =
    trpc.analytics.getDropoffByPage.useQuery({ formId }, { enabled: !!formId });

  const { data: form } = trpc.form.getById.useQuery({ formId }, { enabled: !!formId });

  const { data: fieldStats } = trpc.analytics.getFieldStats.useQuery(
    { formId, fieldId: selectedFieldId! },
    { enabled: !!formId && !!selectedFieldId },
  );

  const overviewData = overview as any;
  const dailyData = (dailyStats as any[]) ?? [];
  const dropoffData = (dropoffs as any[]) ?? [];
  const fields = ((form as any)?.fields as any[]) ?? [];

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      {/* Overview tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {overviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))
        ) : (
          <>
            <TintCard tint="sky">
              <TintCard.Number>
                <NumberTicker value={overviewData?.totalViews ?? 0} />
                <Doodle name="arrow-curve" className="inline-block size-4 ml-1" />
              </TintCard.Number>
              <TintCard.Caption>Total Views</TintCard.Caption>
            </TintCard>
            <TintCard tint="peach">
              <TintCard.Number>
                <NumberTicker value={overviewData?.totalStarts ?? 0} />
              </TintCard.Number>
              <TintCard.Caption>Total Starts</TintCard.Caption>
            </TintCard>
            <TintCard tint="mint">
              <TintCard.Number>
                <NumberTicker value={overviewData?.totalSubmissions ?? 0} />
              </TintCard.Number>
              <TintCard.Caption>Submissions</TintCard.Caption>
            </TintCard>
            <TintCard tint="forest">
              <TintCard.Number>
                <NumberTicker value={overviewData?.completionRate ?? 0} suffix="%" />
              </TintCard.Number>
              <TintCard.Caption>Completion Rate</TintCard.Caption>
            </TintCard>
          </>
        )}
      </div>

      {/* Daily chart */}
      <EditorialCard>
        <h2 className="text-xl font-semibold mb-4">Daily activity</h2>
        {dailyLoading ? (
          <Skeleton className="h-72 rounded-xl" />
        ) : dailyData.length === 0 ? (
          <EmptyState
            headline="Not enough data yet."
            description="Share your form to start collecting analytics."
          />
        ) : (
          <ResponsiveContainer width="100%" height={288}>
            <AreaChart data={dailyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(new Date(d), "MMM d")}
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
              />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stackId="1"
                stroke="var(--tint-sky-ink)"
                fill="var(--tint-sky)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="starts"
                stackId="1"
                stroke="var(--tint-peach-ink)"
                fill="var(--tint-peach)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="submissions"
                stackId="1"
                stroke="var(--tint-mint-ink)"
                fill="var(--tint-mint)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </EditorialCard>

      {/* Drop-off chart */}
      {dropoffData.length > 0 && (
        <EditorialCard>
          <h2 className="text-xl font-semibold mb-4">Drop-off by page</h2>
          <ResponsiveContainer width="100%" height={Math.max(120, dropoffData.length * 48)}>
            <BarChart
              data={dropoffData}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 60, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis
                type="category"
                dataKey="page"
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                tickFormatter={(v) => `Page ${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="dropoffs" fill="var(--tint-blush)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </EditorialCard>
      )}

      {/* Field stats */}
      {fields.length > 0 && (
        <EditorialCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Field statistics</h2>
            <Select value={selectedFieldId ?? ""} onValueChange={setSelectedFieldId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!selectedFieldId && (
            <p className="text-sm text-muted-foreground">
              Select a field to view its statistics.
            </p>
          )}
          {selectedFieldId && fieldStats && (
            <div className="text-sm">
              <pre className="bg-secondary/50 rounded-lg p-4 overflow-auto text-xs">
                {JSON.stringify(fieldStats, null, 2)}
              </pre>
            </div>
          )}
        </EditorialCard>
      )}
    </div>
  );
}
