
# Einleitung und Ziele {#section-introduction-and-goals}
Get me drunk efficiently stellt einen Service zur Verfügung, welcher mittels Zutatenliste Vorschläge für Cocktails bietet, um einen gewünschten Promille-Wert zu erreichen.

## Aufgabenstellung
Im Rahmen der Vorlesung „Moderne Softwarearchitekuren“ wurde die Aufgabe gestellt, ein Projekt mit DDD Vorgehensweise zu entwickeln und dokumentieren.

# Requirements Overview

# Quality Goals
* Einfache Bedienbarkeit

    * Der Nutzer soll ohne große umstände nach dem Starten der App siene Suche starten können. z.B. keine Freitexte (Listen mit allen Zutaten) damit schnell die richtige Benamung gefunden werden kann.

* Schnelle Antwortzeiten

    * Eine Anfrgae soll bei einen stabilen Internetverbindung nicht länger als 2h dauern.

* Abwechslungsreicher Cocktail-Mix

    * Der Nutzer soll für seine Anfrage für eine abwechslungsreiche Auswahl an Cocktails bekommen 

* Plattformunabhängige Benutzung


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

![Fachlicher Kontext][Fachlicher_Kontext]

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

## Technischer Kontext

![Technischer Kontext][Technischer_Kontext]

### Client
Die Anbindung von GMDE erfolgt über eine graphische Oberflächer welche vom Entwicklerteam bereitgestellt wird. Da das Backend eine REST-Scnittstelle bereitstellt, kann jedoch auch ein separates Frontend entwickelt werden und nur der Backendservice verwendet werden. Die REST-Schnittstelle kann über das HTTP Protokoll angesprochen werde genaue Informationen ....

### WikiData
Die Informationen zu den Cocktails werden per HTTP-Protokoll und der WikiData Querry-Sprache SPARQL von der WikiData Datenbank angefordert.

### Open Food Facts
Die Weiterführenden Informationen zum Alkoholgehalt werden über die FoodID aus der WikiData Datenbank über das HTTP-Protokoll und SPARSQL aus der OpenFoodFacts API angefragt.

### WikiMedia
Die Bilder zu den jeweiligen Cocktails werden über das HTTP-Protokoll und SPARSQL aus dem WikiMedia Datenbestand angefragt.

# Building Block View
## Scope und Kontext
![Scope und Kontext][Scope und Kontext]

### WIKI-Data
Die Wiki-Data Datenbank ist der zentrale Datenbestand über den die Informationen zu Cocktails bezogen werden. Diese Schnittstelle wird über sog. SPARQL querries angesprochen.

### Open Food Facts
Datenbank über Witerführende Informationen wie den Alkoholgehalt fals dieser in Wiki-Data nicht vorhanden ist.
Diese REST baiserte Schnittstelle wird vom Backend und kann über das HTTP-Protokoll aufgerufen werden.

###  GMDE
Das Back- und Frontend, welche die Zutaten des Benutzers entgegen nimmt und daraufhin eine Auswahl an Cocktails zusammenstellt.

## Ebene 1
![Ebene 1][Ebene 1]
### Backend
Das Backend kommuniziert auf der einen seite mit den externen Schnittstellen um die Daten für die Cocktails zusammen zu sammeln. Auf der anderen Seite kommuniziert das Backend über REST-Schnitstellen mit dem Frontend um Filterparameter usw. zu erhalten und eine passende Auswahl an Cocktails zusammen zu stellen und an das Frontend zurück zu schicken.

### Frontend
Das Frontend bildet die Schnittstelle zwischen dem Benutzer und dem Backend. Der Benutzer kann über eine Web-App auf das Frontend zugreifen und erhält dort auch die Cocktail-Zusammenstellung aus dem Backend.

## Ebene 2a Backend
![Ebene_2_backend][Ebene_2_backend]

### Data
Data ist im Backend für die Kommunikation mit den externen Services zuständig. Hier werden die Anfragen an die APIs getätigt und die Daten für die Cocktails aggregiert.

### Service
Service beinhaltet die Anwendungslogik um die Daten welche von den externen Systemen bezogen wereden weiter zu verarbeiten. Hier werden die Zutaten gefiltert welche vom benutzer im Frontend angegeben werden und auch die Cocktails zusammengestellt die dann zum Frontend zurückgeschickt werden.

### API 
Stellt die REST-Schnittstelle welche vom Fronend angesprochen wird zur verfügung.

# Laufzeitsicht
![Laufzeitischt][Laufzeitischt]
1. Beim Systemstart werden initial die Daten von den externen Systemen abgefragt und gespeichert. dies wird gemacht, da die SPARQL-Anfragen unter Umständen sehr lange dauern.
2. Der Benutzer ruft das Frontend auf
3. Das Frontend ruft alle Zutaten (Ingredients) vom backend ab um eine Auto-Vervollständigung zur verfügung zu stellen.
4. Der Benutzer gibt Zutaten, Körpergewicht und gewünschten Ziel-Promillwert ein.
5. Das Frontend schickt die Daten die vvom Benutzer eigegeben werden an das Backend.
6. Das Backend berechnet anhand der Eingaben des Benutzers die möglichen Cocktailkombinationen und schickt diese an das Frontend zurück.
7. Dsa Frontend zeigt die Cocktails an, welche aufgrund der Eingaben vom Backend zurückgeschickt wurden.

# Konzepte

![DDD][DDD]






[React_JS]: https://reactjs.org/docs/getting-started.html
[Typescript_JS]: https://www.typescriptlang.org/


[Fachlicher_Kontext]: doc_ressources/images/fachlicher_kontext.png
[Technischer_Kontext]: doc_ressources/images/technischer_kontext.png

[Scope und Kontext]: doc_ressources/images/scope_and_context.png
[Ebene 1]: doc_ressources/images/Ebene_1.png
[Ebene_2_backend]: doc_ressources/images/Ebene_2_Backend.png


[Laufzeitischt]: doc_ressources/images/Ablaufsicht.png

[DDD]: doc_ressources/images/DDD_Modle.png