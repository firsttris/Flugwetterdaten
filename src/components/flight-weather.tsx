import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { ErrorNote, Skeleton } from "@/components/status";
import type { Cloud, Metar, Taf, TafPeriod } from "@/lib/api";
import { cardinal, convertWind, formatTime, pad3, UNIT_SHORT, type WindUnit } from "@/lib/units";

const COVER: Record<string, string> = { FEW: "wenige", SCT: "aufgelockert", BKN: "durchbrochen", OVC: "bedeckt", VV: "Vertikalsicht" };

function clouds(cover: string | undefined, list: Cloud[]): string {
  if (cover === "CAVOK") return "CAVOK";
  const layers = list.filter((c) => c.base != null && COVER[c.cover]);
  if (!layers.length) return "keine";
  const c = layers[0];
  return `${COVER[c.cover]}, ${c.base!.toLocaleString("de-DE")} ft`;
}

function visibility(v: number | string | null | undefined): string {
  if (v == null) return "–";
  if (typeof v === "string" && v.endsWith("+")) return "über 10 km";
  const km = Number(v) * 1.609;
  return km >= 10 ? "über 10 km" : `${km.toLocaleString("de-DE", { maximumFractionDigits: 1 })} km`;
}

const CHANGE: Record<string, string> = { BECMG: "Übergang", TEMPO: "zeitweise", FM: "ab", PROB: "möglich" };

function wind(p: { wdir: number | "VRB" | null; wspd: number | null; wgst: number | null }, unit: WindUnit) {
  if (p.wspd == null) return null;
  const u = UNIT_SHORT[unit];
  const dir = typeof p.wdir === "number" ? `${cardinal(p.wdir)} (${pad3(p.wdir)}°)` : "wechselnd";
  return `${dir} ${convertWind(p.wspd, unit)} ${u}${p.wgst ? `, Böen ${convertWind(p.wgst, unit)} ${u}` : ""}`;
}

function TafRow({ p, unit }: { p: TafPeriod; unit: WindUnit }) {
  const from = formatTime(new Date(p.timeFrom * 1000));
  const to = formatTime(new Date(p.timeTo * 1000));
  const kind = p.probability ? `${p.probability} % ${p.fcstChange === "TEMPO" ? "zeitweise" : "möglich"}` : p.fcstChange ? CHANGE[p.fcstChange] ?? p.fcstChange : null;
  const parts = [wind(p, unit), p.visib != null && `Sicht ${visibility(p.visib)}`, p.wxString].filter(Boolean);
  return (
    <p className="mb-2">
      <strong className="text-foreground">
        {from}–{to}
        {kind && <span className="font-normal text-muted-foreground"> · {kind}</span>}:
      </strong>{" "}
      {parts.join(" · ") || "keine Änderung"}
    </p>
  );
}

export function FlightWeather({
  metar,
  taf,
  error,
  sun,
  unit,
}: {
  metar: Metar | null;
  taf: Taf | null;
  error: Error | null;
  sun?: { sunrise: Date; sunset: Date };
  unit: WindUnit;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Flugwetter EDSB</CardTitle>
        {metar?.fltCat && <Badge variant={metar.fltCat === "VFR" ? "good" : "secondary"}>{metar.fltCat}</Badge>}
      </CardHeader>
      <CardContent>
        {metar ? (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 tabular-nums sm:grid-cols-3">
              <Item k="Temperatur" v={`${metar.temp} °C`} />
              <Item k="Taupunkt" v={`${metar.dewp} °C`} />
              <Item k="QNH" v={`${Math.round(metar.altim)} hPa`} />
              <Item k="Sicht" v={visibility(metar.visib)} />
              <Item k="Wolken" v={clouds(metar.cover, metar.clouds)} />
              {sun && <Item k="Sonne" v={`${formatTime(sun.sunrise)} – ${formatTime(sun.sunset)}`} />}
            </div>
            <div className="mt-3.5 overflow-x-auto rounded-lg bg-muted px-3 py-2.5 font-mono text-xs whitespace-nowrap">{metar.rawOb}</div>
          </>
        ) : error ? (
          <ErrorNote what="Die Flugwetterdaten" />
        ) : (
          <Skeleton className="h-28 w-full" />
        )}
      </CardContent>
      {taf && (
        <Collapsible title="Vorhersage (TAF)">
          {taf.fcsts.map((p) => (
            <TafRow key={`${p.timeFrom}-${p.fcstChange}-${p.probability}`} p={p} unit={unit} />
          ))}
          <div className="mt-1.5 overflow-x-auto rounded-lg bg-muted px-3 py-2.5 font-mono text-xs whitespace-nowrap text-foreground">{taf.rawTAF}</div>
        </Collapsible>
      )}
    </Card>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}
