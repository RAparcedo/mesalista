import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ApiError } from "../api/client";
import { getDaily, getHours, getOccupancy, getSummary } from "../api/stats";
import type {
  DailyPoint,
  DateRange,
  HourPoint,
  OccupancyPoint,
  StatsSummary,
} from "../api/stats";
import { useAuth } from "../context/AuthContext";
import { daysAgoISO, todayISO } from "../lib/dates";
import { ErrorMessage } from "../components/ErrorMessage";

// Chart color: azulejo only. Saffron fails the 3:1 contrast check on white,
// so it never encodes data — it stays a UI accent.
const CHART_BLUE = "#2a4d8f";
const GRID_SOFT = "#e9eff7";

type Preset = "7d" | "30d" | "custom";

// Default export so the route can React.lazy() this page — Recharts is heavy
// and only admins need it; public visitors never download this chunk.
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [preset, setPreset] = useState<Preset>("30d");
  const [range, setRange] = useState<DateRange>({ from: daysAgoISO(29), to: todayISO() });
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [hours, setHours] = useState<HourPoint[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyPoint[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");

  const fetchStats = useCallback(() => {
    setStatus("loading");
    Promise.all([getSummary(range), getDaily(range), getHours(range), getOccupancy(range)])
      .then(([summaryData, dailyData, hoursData, occupancyData]) => {
        setSummary(summaryData);
        setDaily(dailyData);
        setHours(hoursData);
        setOccupancy(occupancyData);
        setStatus("success");
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          logout();
          navigate("/admin/login");
          return;
        }
        setStatus("error");
      });
  }, [range, logout, navigate]);

  useEffect(fetchStats, [fetchStats]);

  function applyPreset(next: Preset) {
    setPreset(next);
    if (next === "7d") setRange({ from: daysAgoISO(6), to: todayISO() });
    if (next === "30d") setRange({ from: daysAgoISO(29), to: todayISO() });
    // "custom" keeps the current range; the date inputs take over.
  }

  const presetClass = (value: Preset) =>
    `rounded-full border px-3 py-1 text-sm ${
      preset === value
        ? "border-saffron bg-saffron/15 font-medium text-ink"
        : "border-azulejo-soft bg-white text-ink/60 hover:text-azulejo"
    }`;

  const inputClass =
    "rounded-md border border-azulejo-soft bg-white px-2 py-1 text-sm focus:border-azulejo focus:outline-2 focus:outline-offset-2 focus:outline-saffron";

  const isEmpty = status === "success" && summary !== null && summary.total === 0;

  return (
    <>
      {/* Range filter — one row above everything; every card and chart follows it */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => applyPreset("7d")} className={presetClass("7d")}>
          Últimos 7 días
        </button>
        <button onClick={() => applyPreset("30d")} className={presetClass("30d")}>
          Últimos 30 días
        </button>
        <button onClick={() => applyPreset("custom")} className={presetClass("custom")}>
          Personalizado
        </button>
        {preset === "custom" && (
          <span className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Desde"
              className={inputClass}
              value={range.from}
              max={range.to}
              onChange={(e) => setRange({ ...range, from: e.target.value })}
            />
            <span className="text-sm text-ink/50">a</span>
            <input
              type="date"
              aria-label="Hasta"
              className={inputClass}
              value={range.to}
              min={range.from}
              onChange={(e) => setRange({ ...range, to: e.target.value })}
            />
          </span>
        )}
      </div>

      {status === "error" && (
        <div className="mt-6">
          <ErrorMessage message="No hemos podido cargar las estadísticas." onRetry={fetchStats} />
        </div>
      )}

      {status !== "error" && (
        <>
          {/* Stat cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Reservas" value={summary?.total} loading={status === "loading"} />
            <StatCard label="Comensales" value={summary?.covers} loading={status === "loading"} />
            <StatCard
              label="Cancelación"
              value={
                summary === null ? undefined : `${Math.round(summary.cancellationRate * 100)}%`
              }
              loading={status === "loading"}
            />
            <StatCard
              label="Personas / reserva"
              value={summary?.avgPartySize}
              loading={status === "loading"}
            />
          </div>

          {/* Daily chart */}
          <ChartCard title="Reservas por día" loading={status === "loading"} empty={isEmpty}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid vertical={false} stroke={GRID_SOFT} />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tick={{ fill: "#23272e99", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#23272e99", fontSize: 12 }}
                />
                <Tooltip content={<DailyTooltip />} cursor={{ fill: GRID_SOFT, opacity: 0.5 }} />
                <Bar dataKey="reservations" fill={CHART_BLUE} radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Occupancy: bounded rate, so the axis is the honest 0-100% */}
          <ChartCard title="Ocupación por día" loading={status === "loading"} empty={isEmpty}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={occupancy.map((d) => ({ ...d, pct: d.occupancy * 100 }))}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid vertical={false} stroke={GRID_SOFT} />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tick={{ fill: "#23272e99", fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#23272e99", fontSize: 12 }}
                />
                <Tooltip content={<OccupancyTooltip />} cursor={{ fill: GRID_SOFT, opacity: 0.5 }} />
                <Bar dataKey="pct" fill={CHART_BLUE} radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Hours chart */}
          <ChartCard title="Reservas por turno" loading={status === "loading"} empty={isEmpty}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hours} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid vertical={false} stroke={GRID_SOFT} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#23272e99", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#23272e99", fontSize: 12 }}
                />
                <Tooltip content={<HoursTooltip />} cursor={{ fill: GRID_SOFT, opacity: 0.5 }} />
                <Bar dataKey="reservations" fill={CHART_BLUE} radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </>
  );
}

function ChartCard({
  title,
  loading,
  empty,
  children,
}: {
  title: string;
  loading: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 rounded-xl border border-azulejo-soft bg-white p-4 shadow-sm">
      <h2 className="text-sm font-medium text-ink/70">{title}</h2>
      {loading ? (
        <div className="mt-3 h-64 animate-pulse rounded-md bg-azulejo-soft/50" />
      ) : empty ? (
        <p className="flex h-64 items-center justify-center text-sm text-ink/50">
          Sin datos en este rango.
        </p>
      ) : (
        <div className="mt-3 h-64">{children}</div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | string | undefined;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-azulejo-soft bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-azulejo-soft/60" />
      ) : (
        <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-azulejo">
          {value ?? "—"}
        </p>
      )}
    </div>
  );
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function OccupancyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: OccupancyPoint & { pct: number } }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const fullDate = new Date(point.date).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
  return (
    <div className="rounded-md border border-azulejo-soft bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-ink">{fullDate}</p>
      <p className="mt-1 flex items-center gap-1.5 text-ink/70">
        <span aria-hidden className="inline-block size-2.5 rounded-xs" style={{ background: CHART_BLUE }} />
        {point.booked} de {point.capacity} mesas-turno ({Math.round(point.pct)}%)
      </p>
    </div>
  );
}

function HoursTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: HourPoint }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-azulejo-soft bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-ink">Turno de las {point.time}</p>
      <p className="mt-1 flex items-center gap-1.5 text-ink/70">
        <span aria-hidden className="inline-block size-2.5 rounded-xs" style={{ background: CHART_BLUE }} />
        {point.reservations} reservas · {point.covers} comensales
      </p>
    </div>
  );
}

// Custom tooltip: full date plus both measures. Text wears text colors;
// the little square carries the series identity.
function DailyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DailyPoint }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const fullDate = new Date(point.date).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
  return (
    <div className="rounded-md border border-azulejo-soft bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-ink">{fullDate}</p>
      <p className="mt-1 flex items-center gap-1.5 text-ink/70">
        <span aria-hidden className="inline-block size-2.5 rounded-xs" style={{ background: CHART_BLUE }} />
        {point.reservations} reservas · {point.covers} comensales
      </p>
    </div>
  );
}
