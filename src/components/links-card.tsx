import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";

const LINKS = [
  ["Windfinder Superforecast", "https://de.windfinder.com/weatherforecast/flughafen_karlsruhe_baden-baden"],
  ["Meteociel Lauterbourg", "https://www-meteociel-com.translate.goog/previsions/24854/lauterbourg.htm?_x_tr_sl=fr&_x_tr_tl=de&_x_tr_hl=de&_x_tr_pto=wapp"],
  ["ELWIS Iffezheim", "https://www.elwis.de/DE/dynamisch/Wasserstaende/Pegeleinzeln%3AIFFEZHEIM"],
  ["HVZ Pegel Iffezheim", "https://www.hvz.baden-wuerttemberg.de/pegel.html?id=09137"],
  ["LUBW Wassertemperatur", "https://niz.baden-wuerttemberg.de/oberflaechengewaesser/gueteparameter?view=0&id=2838"],
];

export function LinksCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Links</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {LINKS.map(([label, href]) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border bg-card px-2.5 py-1.5 text-[13px] hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
          >
            {label}
          </a>
        ))}
      </CardContent>
      <Collapsible title="Rechtliche Hinweise">
        <p className="mb-2">
          <strong className="text-foreground">Nicht-kommerzielles Projekt:</strong> Private Initiative für die Sicherheit von
          Wassersportlern am Rhein. Keine offizielle Verbindung zum Flughafen Karlsruhe/Baden-Baden.
        </p>
        <p className="mb-2">
          <strong className="text-foreground">Datenquellen:</strong> Die Daten stammen von aviationweather.gov, Open-Meteo (DWD),
          LUBW und Pegelonline (WSV). Bei Einwänden bitte kurz per{" "}
          <a className="underline" href="https://github.com/firsttris/Flugwetterdaten/issues" target="_blank" rel="noopener noreferrer">
            GitHub Issue
          </a>{" "}
          melden.
        </p>
        <p>
          <strong className="text-foreground">Keine Gewähr:</strong> Alle Daten dienen nur der Orientierung und ersetzen keine
          offizielle Flugwetterberatung oder Gefahrenprüfung. Nutzung auf eigene Gefahr.
        </p>
      </Collapsible>
    </Card>
  );
}
