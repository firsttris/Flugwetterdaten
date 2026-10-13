import { useState, type ReactNode } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Compass } from "@/components/compass";
import type { Settings } from "@/hooks/use-settings";
import { useInstall } from "@/hooks/use-install";
import { disablePush, enablePush, isStandalone, pushSupported, resetApp, showTestNotification } from "@/lib/push";
import { convertWind, UNIT_SHORT, type WindUnit } from "@/lib/units";
import { cn } from "@/lib/utils";

const MIN_WIND = 6;
const MAX_WIND = 25;

export function SettingsSheet({
  settings,
  update,
  testMessage,
}: {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  testMessage: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const install = useInstall();
  const u = UNIT_SHORT[settings.unit];
  const iosNeedsInstall = install.ios && !isStandalone();
  const alarmAvailable = pushSupported() && !iosNeedsInstall;

  async function toggleAlarm(on: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      if (on) await enablePush(settings);
      else await disablePush();
      update({ alarm: on });
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setMessage(null);
    try {
      await showTestNotification(testMessage);
    } catch (err) {
      setMessage((err as Error).message);
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Einstellungen">
          <SettingsIcon />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex flex-col gap-6 px-5 py-4">
          <SheetHeader>
            <SheetTitle>Einstellungen</SheetTitle>
            <SheetDescription>Werden nur auf diesem Gerät gespeichert.</SheetDescription>
          </SheetHeader>

          <Group title="Wind-Alarm">
            <Row label="Push-Nachricht aufs Handy" hint="wenn der Wind im grünen Bereich liegt" htmlFor="alarm">
              <Switch id="alarm" checked={settings.alarm} disabled={busy || (!alarmAvailable && !settings.alarm)} onCheckedChange={toggleAlarm} />
            </Row>
            {iosNeedsInstall && (
              <p className="text-xs text-muted-foreground">
                Auf dem iPhone funktioniert der Alarm nur, wenn die App auf dem Startbildschirm installiert ist (siehe unten).
              </p>
            )}
            {!pushSupported() && !install.ios && (
              <p className="text-xs text-muted-foreground">Dieser Browser unterstützt keine Push-Nachrichten.</p>
            )}
            {message && <p className="text-xs text-destructive">{message}</p>}

            <div className={cn("flex flex-col gap-3.5", !settings.alarm && "pointer-events-none opacity-45")} aria-disabled={!settings.alarm}>
              <div className="flex items-center gap-4">
                <Compass className="size-14 flex-none" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium" id="minWindLabel">Ab Windstärke</span>
                    <output className="text-sm font-semibold tabular-nums">
                      {convertWind(settings.minWind, settings.unit)} {u}
                    </output>
                  </div>
                  <Slider
                    className="mt-2.5"
                    aria-labelledby="minWindLabel"
                    min={MIN_WIND}
                    max={MAX_WIND}
                    step={1}
                    value={[settings.minWind]}
                    onValueChange={([v]) => update({ minWind: v })}
                  />
                  <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                    <span>{convertWind(MIN_WIND, settings.unit)} {u}</span>
                    <span>{convertWind(MAX_WIND, settings.unit)} {u}</span>
                  </div>
                </div>
              </div>
              <Row label="Nur tagsüber" hint="zwischen Sonnenauf- und -untergang" htmlFor="daytime">
                <Switch id="daytime" checked={settings.daytime} onCheckedChange={(v) => update({ daytime: v })} />
              </Row>
              <Row label="Höchstens" hint="damit es nicht dauernd piept">
                <ToggleGroup type="single" value={settings.freq} onValueChange={(v) => v && update({ freq: v as Settings["freq"] })} aria-label="Häufigkeit">
                  <ToggleGroupItem value="1">1× am Tag</ToggleGroupItem>
                  <ToggleGroupItem value="3">alle 3 h</ToggleGroupItem>
                </ToggleGroup>
              </Row>
              <Row label="Auch bei Vorhersage" hint="um 18 Uhr, wenn morgen was geht" htmlFor="forecastAlarm">
                <Switch id="forecastAlarm" checked={settings.forecastAlarm} onCheckedChange={(v) => update({ forecastAlarm: v })} />
              </Row>
              <Button variant="outline" onClick={test}>
                Testnachricht senden
              </Button>
            </div>
          </Group>

          <hr />

          <Group title="Anzeige">
            <Row label="Windeinheit">
              <ToggleGroup type="single" value={settings.unit} onValueChange={(v) => v && update({ unit: v as WindUnit })} aria-label="Windeinheit">
                <ToggleGroupItem value="kn">kn</ToggleGroupItem>
                <ToggleGroupItem value="kmh">km/h</ToggleGroupItem>
                <ToggleGroupItem value="bft">Bft</ToggleGroupItem>
              </ToggleGroup>
            </Row>
            <Row label="Design">
              <ToggleGroup type="single" value={settings.theme} onValueChange={(v) => v && update({ theme: v as Settings["theme"] })} aria-label="Design">
                <ToggleGroupItem value="system">System</ToggleGroupItem>
                <ToggleGroupItem value="light">Hell</ToggleGroupItem>
                <ToggleGroupItem value="dark">Dunkel</ToggleGroupItem>
              </ToggleGroup>
            </Row>
            <Row label="Flugwetter anzeigen" hint="QNH, Sicht, Wolken, METAR/TAF" htmlFor="flight">
              <Switch id="flight" checked={settings.showFlightWeather} onCheckedChange={(v) => update({ showFlightWeather: v })} />
            </Row>
          </Group>

          <hr />

          <Group title="App">
            <Row
              label="Auf den Startbildschirm"
              hint={install.installed ? "ist installiert" : install.ios ? "Teilen-Symbol antippen, dann „Zum Home-Bildschirm“" : "nötig für den Wind-Alarm auf dem iPhone"}
            >
              {!install.installed && install.canPrompt && (
                <Button variant="outline" onClick={install.install}>
                  Installieren
                </Button>
              )}
            </Row>
            <Row label="App zurücksetzen" hint="leert den Cache und lädt neu">
              {confirmReset ? (
                <Button variant="destructive" onClick={resetApp}>
                  Wirklich zurücksetzen
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setConfirmReset(true)}>
                  Zurücksetzen
                </Button>
              )}
            </Row>
          </Group>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {hint && <small className="mt-px block text-xs font-normal text-muted-foreground">{hint}</small>}
      </label>
      {children}
    </div>
  );
}
