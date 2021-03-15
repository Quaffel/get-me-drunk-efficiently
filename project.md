
# Einleitung und Ziele {#section-introduction-and-goals}
Get me drunk efficiently stellt einen Service zur Verfügung, welcher mittels Zutatenliste Vorschläge für Cocktails bietet, um einen gewünschten Promille-Wert zu erreichen.

## Aufgabenstellung
Im Rahmen der Vorlesung „Moderne Softwarearchitekuren“ wurde die Aufgabe gestellt, ein Projekt mit DDD Vorgehensweise zu entwickeln und dokumentieren.

# Requirements Overview

# Quality Goals
* Einfache Bedienbarkeit

..* Der Nutzer soll ohne große umstände nach dem Starten der App siene Suche starten können. z.B. keine Freitexte (Listen mit allen Zutaten) damit schnell die richtige Benamung gefunden werden kann.

* Schnelle Antwortzeiten

..* Eine Anfrgae soll bei einen stabilen Internetverbindung nicht länger als 2h dauern.

* Abwechslungsreicher Cocktail-Mix

..* Der Nutzer soll für seine Anfrage für eine abwechslungsreiche Auswahl an Cocktails bekommen 


# Stakeholders

| Role/Name            | Contact                   | Expectations              
-----------------------|---------------------------|----------------------------
| Ralf Klemmer         | -                         | Domain Drivern Development
| Lena Fischer         | -                         | c
| Johannes Pardoviki   | -                         | c
| Niklas Radomski      | -                         | c
| Jonas Wilms          | -                         | c
| Nico Haefele         | -                         | c
| Nicola Horst         | -                         | c


# Randbedingung
## Technisch
* Nutzung im Browser optimiert für mobile Endgeräte (Smartphones, Tablets etc.).
* Implementiereung Backend in [Typescript][Typescript_JS] only.
* Implementiereung Frontend [React][React_JS] in Typescript.


## Organisatorisch
| Randbedingung     | Erläuterung Hintergrung |
--------------------|-------------------------|
| Team              | J. Pardovicki, J. Wilms, N. Radomski, L.Fischer, N. Haefele, N.Horst|
| Zeitplan          | Beginnend am 08.03.2021 wurde sich darauf geeining, dass bis zum 22.03.2021 ein erster lauffähiger Prototyp fertig gestell werden sollte. Am 25.03.2021 soll das Projet in seiner finalen Version sein.|
| Veröffentlichung als Open Source | Die Quelltexte der Lösung oder zumindest Teile werden als Open Source verfügbar gemacht.|

## Konventionen
| Konventionen  | Erläuterung Hintergrund |
----------------|-------------------------|
| Architekturdokumentation | Terminologie und Gliederung nach dem deutschen arc42-Template|
| Kodierrichtlinien für TS/JS |TS/JS Coding conventiones von Nico H.|
| Sprache (Deutsch vs. Englisch) | Der gesamte Quellcode wird in Englisch verfasst, die Dokumentation auf Deutsch, weil die Hauptnutzergruppe deutschsprachig. (Cocktails usw. deutsch)|

# Kontextabgrenzung

## Fachlicher Kontext

![Fachlicher Kontext](doc_ressources\fachlicher_kontext.png)

### User
Der User bekommt Cocktail-Vorschläge vom System anhand seiner Anagaben wie:
* Zutaten
* Zu erreichende Promille

### Wiki Data (API)
Initiale Abfrage der Cocktailliste mit Zutaten und Beschreibung beim starten des Systems. Hier liegen alle Daten zu den Cocktails, welche dem User vorgeschlagen werden.

### Open Food Facts (API)
Wird hinzugezogen, falls im Cocktailrezept Angaben zum Alkohol felheln. In diesem Fall wird in der Open Food Facts Datenbank nach dem Alkoholgehalt gesucht.

### Wikimedia (API)
Aus dem Wikimedia Datenbestand werden passend zu den Cocktails Bilder geladen welche dem User in der Anwendung angezeigt werden.



# Solution Strategy

# Building Block View

# Whitebox Overall System

Motivation

Contained Building Blocks

Important Interfaces

# Runtime View

# Deployment View

# Infrastructure Level 1

# Cross-cutting Concepts

# Design Decisions

# Quality Requirements

# Quality Tree

# Quality Scenarios

# Risks and Technical Debts



[React_JS]: https://reactjs.org/docs/getting-started.html
[Typescript_JS]: https://www.typescriptlang.org/


[Fachlicher_Kontext]: doc_ressources\fachlicher_kontext.png "fachlicher kontext png"