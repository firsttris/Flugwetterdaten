# Häufige Fragen

## Was kostet die App?

Nichts. Sie ist ein privates, nicht-kommerzielles Projekt ohne Werbung und ohne Tracking.

## Funktioniert der Wind-Alarm auf dem iPhone?

Ja, ab iOS 16.4, aber nur aus der [installierten App](installieren.md) heraus, nicht im normalen
Safari-Tab.

## Warum ist der Wind am Spot anders als in der App?

Der METAR wird am Flughafen gemessen, einige Kilometer entfernt. Gelände und Wasser verändern den
Wind am Spot. Die App zeigt die Messung am Flughafen, keine Schätzung für den Spot.

## Warum ist ausgerechnet Nord-Ost grün?

Nord-Ost ist am Spot die beste Windrichtung. Deshalb markiert die App den Bereich 20–80° grün, im
Kompass, im Windverlauf und in der Vorhersage. Eine Bewertung wie „gut“ oder „schlecht“ gibt die App
bewusst nicht ab.

## Wie genau ist die Strömung?

Nur grob, sie ist aus dem Abfluss geschätzt ([Rechnung](datenquellen.md#strömung)). Für einen
Vergleich zwischen Tagen reicht sie.

## Woher kommen die Farben der Vorhersage?

Es ist die Farbskala von Windfinder, damit man die Balken so liest, wie man es gewohnt ist
([mehr](datenquellen.md#vorhersage)).

## Kann ich die App für meinen eigenen Spot nutzen?

Ja, der Quellcode ist frei (MIT). Flughafen, Position, grüner Bereich und Pegel stehen in wenigen
Konstanten, siehe [Entwicklung](entwicklung.md#einen-anderen-spot-einstellen).

## Die App zeigt alte Werte oder hängt. Was tun?

Einstellungen → **App zurücksetzen**. Steht oben „Veraltet“, liefert der Flughafen gerade keinen
neuen METAR; das kommt nachts gelegentlich vor.
