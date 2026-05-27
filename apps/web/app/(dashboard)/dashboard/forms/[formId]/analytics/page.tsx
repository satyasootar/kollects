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
  PieChart,
  Pie,
  Cell,
  Legend,
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

  const { data: form } = trpc.form.getByIdWithFields.useQuery({ formId }, { enabled: !!formId });

  const { data: fieldStats } = trpc.analytics.getFieldStats.useQuery(
    { formId, fieldId: selectedFieldId! },
    { enabled: !!formId && !!selectedFieldId },
  );

  const overviewData = overview as any;
  const dailyData = (dailyStats as any[]) ?? [];
  const dropoffData = (dropoffs as any[]) ?? [];
  const fields = ((form as any)?.fields as any[]) ?? [];

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto w-full">
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
            <div className="mt-6">
              <FieldStatsRenderer data={fieldStats} />
            </div>
          )}
        </EditorialCard>
      )}
    </div>
  );
}

const COLORS = [
  "var(--tint-sky)",
  "var(--tint-peach)",
  "var(--tint-mint)",
  "#8b5cf6", // lavender
  "var(--tint-blush)"
];

function FieldStatsRenderer({ data }: { data: any }) {
  if (!data || !data.stats) return <p className="text-sm text-muted-foreground">No data available for this field.</p>;

  const { type, stats, totalAnswers } = data;

  if (type === "rating") {
    const distribution = stats.distribution || {};
    const chartData = [1, 2, 3, 4, 5].map((star) => ({
      star: `${star} Star${star > 1 ? "s" : ""}`,
      count: distribution[star] || 0,
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div className="bg-secondary/30 rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Average Rating</p>
            <p className="text-2xl font-semibold">{stats.average || 0}</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Ratings</p>
            <p className="text-2xl font-semibold">{totalAnswers}</p>
          </div>
        </div>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="star" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="count" fill="var(--tint-sky)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === "single_select" || type === "multi_select") {
    const counts = stats.counts || {};
    const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));

    if (chartData.length === 0) return <p className="text-sm text-muted-foreground mt-4">No selections recorded yet.</p>;

    return (
      <div className="flex flex-col md:flex-row items-center gap-8 mt-4">
        <div className="h-64 w-full md:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/2 space-y-2">
          {chartData.map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between text-sm p-3 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="font-medium text-foreground">{entry.name}</span>
              </div>
              <span className="font-semibold text-muted-foreground">{entry.value as React.ReactNode}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "checkbox") {
    const chartData = [
      { name: "Checked", value: stats.trueCount || 0 },
      { name: "Unchecked", value: stats.falseCount || 0 },
    ];
    return (
      <div className="flex flex-col md:flex-row items-center gap-8 mt-4">
        <div className="h-64 w-full md:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                <Cell fill="var(--tint-mint)" />
                <Cell fill="var(--border)" />
              </Pie>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/2 space-y-4">
          <div className="bg-secondary/20 rounded-xl p-5 border border-border flex justify-between items-center">
            <span className="text-sm font-medium">Checked</span>
            <span className="text-2xl font-bold" style={{ color: "var(--tint-mint-ink)" }}>{stats.trueCount || 0}</span>
          </div>
          <div className="bg-secondary/20 rounded-xl p-5 border border-border flex justify-between items-center">
            <span className="text-sm font-medium">Unchecked</span>
            <span className="text-2xl font-bold text-muted-foreground">{stats.falseCount || 0}</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "number") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-secondary/30 rounded-xl p-6 border border-border text-center shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Average</p>
          <p className="text-4xl font-bold text-foreground">{stats.average ?? "—"}</p>
        </div>
        <div className="bg-secondary/30 rounded-xl p-6 border border-border text-center shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Minimum</p>
          <p className="text-4xl font-bold text-foreground">{stats.min ?? "—"}</p>
        </div>
        <div className="bg-secondary/30 rounded-xl p-6 border border-border text-center shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Maximum</p>
          <p className="text-4xl font-bold text-foreground">{stats.max ?? "—"}</p>
        </div>
      </div>
    );
  }

  // Text fields (short_text, long_text, email, etc)
  return (
    <div className="bg-secondary/30 rounded-xl p-8 border border-border text-center max-w-sm mt-4 shadow-sm">
      <div className="text-5xl font-bold mb-3 text-foreground">{totalAnswers}</div>
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Responses Recorded</p>
    </div>
  );
}
