# Fitness-App

Teamprojekt aus Web-Engineering und IT-Sicherheit an der FH Münster.
Die App vereint Trainingspläne, Trainingshistorie, Ernährungstagebuch,
Dashboard und eine Oberfläche für die Verwaltung. Der Stack besteht aus
Lit und TypeScript im Browser, Express im Backend und PostgreSQL.

## Simon Cebulas Beitrag

Ich habe am Ernährungstagebuch vom Datenmodell bis zur Oberfläche gearbeitet.
Dazu gehören die Lebensmittelauswahl, Mahlzeiteneinträge, Makrovorschau,
Tageszusammenfassungen und die Ernährungsansicht in der Verwaltung.
Weitere Beiträge betreffen Teile des Dashboards, einzelne Sicherheitsmodule
und Tests.

Die Autorenangaben in den Dateien bleiben erhalten. Die
[Dateiliste mit meinen Autoreneinträgen](CONTRIBUTIONS.md) unterscheidet
alleinige von gemeinsam ausgewiesenen Beiträgen.

## Lokale Demo

Mit Docker Compose und OpenSSL:

```sh
./scripts/setup-demo.sh
docker compose up --build
```

Unter http://localhost:8080 kannst du dich als `example2@example.test`
(Mitglied) oder `example1@example.test` (Verwaltung) anmelden. Das Passwort
für die fiktiven Demo-Konten ist `DemoSecure123!`. Die Anschlüsse der
Demo sind nur am eigenen Rechner erreichbar. `docker compose down`
stoppt die App und behält den Demo-Datenbestand im lokalen Docker-Volume.

## Tests und Build

Mit Node.js 22:

```sh
npm ci --prefix api-server
npm test --prefix api-server
npm ci --prefix client
npm run build --prefix client
npm ci --prefix tests/component
npm run test:ci --prefix tests/component
```
