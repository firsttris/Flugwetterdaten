# Datenquellen und Berechnungen

| Wert | Quelle | Neu geladen |
|---|---|---|
| Wind jetzt, Windverlauf, Flugwetter | METAR EDSB (Baden-Airpark) von [aviationweather.gov](https://aviationweather.gov/data/api/) | alle 5 Minuten |
| TAF | [aviationweather.gov](https://aviationweather.gov/data/api/) | alle 30 Minuten |
| Vorhersage 3 Tage, Sonnenauf- und -untergang | [Open-Meteo](https://open-meteo.com/), Modell ICON des DWD | alle 30 Minuten |
| Pegel, Abfluss, Hochwasser | [Pegelonline](https://www.pegelonline.wsv.de/) (WSV), Pegel Iffezheim | alle 5 Minuten |
| Wassertemperatur | [LUBW](https://niz.baden-wuerttemberg.de), Messstelle 2838 | alle 30 Minuten |

Zusätzlich lädt die App alles neu, sobald sie wieder in den Vordergrund kommt. Schlägt ein Abruf
fehl, bleiben die letzten Werte stehen.

## METAR

Der METAR ist die Wettermeldung des Flughafens, in der Regel alle 30 Minuten. Er enthält Wind
(Richtung in Grad, Mittelwind und Böen in Knoten), Sicht, Wolken, Temperatur, Taupunkt und QNH.
Die Richtung ist die, **aus der** der Wind kommt. „VRB“ bedeutet wechselnde Richtung, meist bei
schwachem Wind.

Der Flughafen liegt einige Kilometer vom Spot entfernt. Am Rhein kann der Wind deshalb etwas anders
sein als gemessen.

## Vorhersage

Die Vorhersage kommt vom Modell **ICON** des Deutschen Wetterdienstes über Open-Meteo
(`icon_seamless`: für die ersten zwei Tage das feine ICON-D2 mit 2 km Raster, danach ICON-EU), für
den Punkt 48,78° N / 8,05° O am Rhein. Es ist eine Modellrechnung, keine Messung; zum Vergleich gibt
es in der App die Links unter „Zweite Meinung“.

Die Farben der Balken sind die Windfinder-Skala: eine Farbe je 2 Knoten, von Lila (Flaute) über Blau
und Grün (um 20 kn) bis Gelb, Orange und Rot (ab 30 kn). Ab 40 kn bleibt es bei der letzten Farbe.

## TAF

Die TAF ist die offizielle Flughafen-Vorhersage für 24 bis 30 Stunden. Sie nennt nur Änderungen,
etwa „ab 19 Uhr Übergang auf Ost, 7 kn“, und ist gröber als die Modellvorhersage. Die App übersetzt
die Abschnitte in normale Sprache:

| Kürzel | In der App |
|---|---|
| `BECMG` | Übergang |
| `TEMPO` | zeitweise |
| `FM` | ab |
| `PROB30` / `PROB40` | 30 % / 40 % möglich |

## Pegel und Trend

Der Wasserstand ist der aktuelle Wert am Pegel Iffezheim. Der Trend vergleicht ihn mit dem Wert von
vor 24 Stunden: mehr als 2 cm höher ist **steigend**, mehr als 2 cm tiefer **fallend**, sonst
**stabil**.

## Hochwasser

Pegelonline ordnet jeden Wert in Bereiche ein (unter Mittelniedrigwasser, normal, über
Mittelhochwasser, dazu Hoch- und Niedrigwassermarken). Die App zeigt daraus **Hochwasser**,
**Niedrigwasser** oder **Normal**.

## Strömung

Die Strömung wird nicht gemessen, sondern aus dem Abfluss geschätzt:

```
mittlere Geschwindigkeit = Abfluss / Querschnitt        Querschnitt ≈ 300 m × 6 m
Oberfläche              ≈ 1,3 × mittlere Geschwindigkeit
```

Bei 1.120 m³/s ergibt das etwa 2,9 km/h. Breite und Tiefe sind grobe Annahmen, deshalb steht „ca.“
davor. Für einen Vergleich von Tag zu Tag taugt der Wert gut, als genaue Zahl nicht.
