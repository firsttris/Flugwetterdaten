# Wind-Alarm

Der Wind-Alarm schickt eine Push-Nachricht aufs Handy, wenn der Wind aus dem **grünen Bereich**
(20–80°, Nord-Ost) kommt und mindestens so stark ist wie eingestellt. Man muss also nicht ständig
nachsehen.

## Einschalten

1. Die App [installieren](installieren.md) (auf dem iPhone Pflicht, auf Android empfohlen).
2. Einstellungen → **Push-Nachricht aufs Handy** einschalten.
3. Die Nachfrage des Browsers nach Benachrichtigungen mit **Erlauben** beantworten.
4. Mit **Testnachricht senden** prüfen, ob Benachrichtigungen ankommen.

## Einstellungen

| Einstellung | Bedeutung | Standard |
|---|---|---|
| **Ab Windstärke** | Mindest-Mittelwind, 6 bis 25 kn (Anzeige in der gewählten Einheit) | 12 kn |
| **Nur tagsüber** | nur zwischen Sonnenauf- und Sonnenuntergang | an |
| **Höchstens** | „1× am Tag“ oder „alle 3 h“, solange der Wind passt | 1× am Tag |
| **Auch bei Vorhersage** | um 18 Uhr eine Nachricht, wenn morgen zwischen 7 und 20 Uhr Nord-Ost über der Schwelle angesagt ist | aus |

Änderungen gehen nach einer knappen Sekunde automatisch an den Server.

## Wie die Prüfung abläuft

Alle 30 Minuten holt der Server den neuesten METAR und prüft für jedes angemeldete Gerät:

1. Ist die Messung jünger als 75 Minuten?
2. Kommt der Wind aus 20–80° und ist der Mittelwind mindestens so stark wie eingestellt?
3. Ist es hell genug (bei „Nur tagsüber“)?
4. Ist seit der letzten Nachricht genug Zeit vergangen?

Passt alles, kommt eine Nachricht wie **„17 kn, Böen 24 kn aus 050° · METAR 15:50 Uhr“**.

Beim Vorhersage-Alarm sieht die Nachricht so aus: **„13–17 Uhr, bis 20 kn aus 045° (Vorhersage)“**.

!!! info "Warum nicht sofort?"
    Der METAR erscheint alle 30 Minuten, und der Server prüft im selben Takt. Zwischen Windaufkommen
    und Nachricht können deshalb bis zu etwa 30 Minuten liegen.

## Datenschutz

Gespeichert wird nur, was für den Versand nötig ist: die Push-Adresse des Browsers, die
Alarm-Einstellungen und wann zuletzt eine Nachricht kam. Kein Name, keine E-Mail, kein Standort.
Wer den Alarm ausschaltet oder die App löscht, wird beim nächsten Versuch automatisch entfernt.

## Es kommt nichts an

- **Testnachricht kommt nicht**: Benachrichtigungen für die App oder den Browser in den
  Systemeinstellungen erlauben; auf dem iPhone die installierte App verwenden.
- **Testnachricht kommt, Alarm nicht**: Prüfen, ob der Wind wirklich aus 20–80° kam und über der
  Schwelle lag, und ob „1× am Tag“ für heute schon verbraucht ist. Die Schwelle kurz niedrig
  stellen hilft beim Ausprobieren.
- **Schalter lässt sich nicht einschalten**: Die Fehlermeldung darunter nennt den Grund, etwa dass
  der Browser keine Push-Nachrichten kann.
