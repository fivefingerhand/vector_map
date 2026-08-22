# Stato Progetto

## MVP web map

Stato: prima versione funzionante locale.

Completato:

- struttura progetto statica;
- Leaflet con CARTO Voyager, Ortofoto Lombardia 2024 ed Esri World Imagery;
- Ortofoto Lombardia 2024 attiva di default;
- Leaflet incluso localmente in `vendor/leaflet/`;
- apertura diretta di `index.html` senza fetch del GeoJSON;
- centro iniziale su Melegnano;
- confine catastale comunale di Melegnano da fogli `F100` 1-16;
- maschera semitrasparente sull'area esterna;
- pulsante "La mia posizione";
- marker posizione utente;
- cerchio di accuratezza GPS;
- verifica dentro/fuori Comune via point-in-polygon client-side;
- riconoscimento del Comune cliccato fuori da Melegnano su comuni catastali locali, con fallback ISTAT;
- modalita "Segui posizione";
- reset vista;
- scala metrica dinamica;
- menu layer minimo;
- selettore basemap Satellite/Stradale/Satellite Esri;
- confine operativo basato sui fogli catastali Melegnano `F100` da 1 a 16;
- maschera e verifica dentro/fuori basate sui fogli catastali Melegnano;
- riconoscimento dei comuni nell'area di Melegnano basato sui fogli catastali WFS raggruppati per comune;
- click ripetuto sullo stesso comune selezionato per disattivare l'evidenziazione;
- click dentro o sulla linea del confine catastale operativo attribuito a Melegnano;
- click fuori dai poligoni catastali locali attribuito al comune catastale piu vicino entro soglia, poi fallback ISTAT senza mai riassegnare Melegnano fuori dal confine catastale operativo;
- GPS classificato sul punto rilevato rispetto al confine catastale operativo di Melegnano;
- rimosso il blocco del fallback ISTAT basato sul rettangolo di copertura catastale;
- layout mobile-first.

Da verificare su HTTPS:

- geolocalizzazione da iPhone/Safari;
- geolocalizzazione da Android/Chrome;
- prestazioni e leggibilita su schermi piccoli.


Ho rivisto l'implementazione corrente fino al commit a9afdd7. Nel complesso la priorita catastale funziona come previsto: dentro o sulla linea del confine operativo di Melegnano prevale sempre Melegnano.

Esito rapido

La logica attuale e:

perimetro catastale di Melegnano;
altri comuni catastali locali;
se nessun catastale contiene il punto, comune catastale piu vicino entro soglia;
altrimenti fallback ISTAT, escludendo Melegnano se il punto e gia risultato fuori dal confine catastale operativo.

La precedenza a Melegnano e corretta e impedisce che un'eventuale sovrapposizione con un comune vicino lo "mangi". Il punto sulla linea del confine catastale viene trattato come Melegnano.

Rischi principali
1. Rettangolo di copertura troppo ampio — priorità alta

cadastralCoverageBounds non rappresenta l’area realmente coperta: è il rettangolo che contiene tutti i dodici comuni catastali caricati.

Risolto: il blocco basato sul rettangolo di copertura catastale e stato rimosso.

2. Risposta GPS basata sul punto rilevato - priorita alta

La mappa mostra il cerchio di accuratezza, ma la classificazione dentro/fuori usa il punto rilevato: dentro o sulla linea catastale e Melegnano, fuori e Fuori Comune.

Questa scelta privilegia la lettura operativa richiesta: massima precedenza al confine catastale di Melegnano, senza stato intermedio "incerto".

3. Rimozione indiscriminata di 198 anelli interni - priorita media

Il perimetro catastale originale di Melegnano contiene 199 anelli: uno esterno e 198 interni. Il codice elimina tutti gli anelli interni prima sia della visualizzazione sia del controllo dentro/fuori.

Probabilmente sono vuoti o artefatti prodotti dall’unione dei fogli, ma il codice presume che lo siano tutti. Se anche uno rappresentasse una discontinuità reale, verrebbe classificato come Melegnano.

Intervento consigliato: validare visivamente i vuoti originali almeno una volta e, idealmente, risolverli nella fase di generazione del GeoJSON. Il browser dovrebbe ricevere direttamente la geometria operativa definitiva, senza modificarne la topologia a runtime.

4. Punto esattamente sulla linea - priorita media

Il ray casting usato da isPointInRing() non definisce esplicitamente come trattare un punto sulla linea. Il risultato può dipendere dal segmento e dalla direzione delle coordinate.

Nella pratica il GPS raramente cade matematicamente sulla linea, ma un click manuale può farlo.

Risolto per Melegnano: una tolleranza metrica minima sulla linea del confine catastale operativo viene attribuita a Melegnano.

5. Sovrapposizioni tra comuni catastali — priorità media

Se due geometrie catastali si sovrappongono:

Melegnano vince sempre;
per gli altri comuni vince il primo nell’array.

Attualmente l’ordine comincia da Carpiano e non rappresenta una regola amministrativa. Un’eventuale sovrapposizione produrrebbe quindi un risultato arbitrario.

Intervento consigliato: durante la preparazione dei dati verificare automaticamente:

sovrapposizioni tra comuni;
vuoti lungo i confini;
geometrie non valide.

In caso di più corrispondenze, la UI dovrebbe indicare Confine ambiguo.

6. “Confine catastale” può sembrare definitivo — priorità media

La mappa nasce per orientamento operativo, ma un collega potrebbe interpretare il risultato come determinazione formale della competenza territoriale.

Intervento consigliato: aggiungere nel pannello una nota breve:

Confine catastale indicativo. In prossimità del limite comunale verificare sugli atti cartografici ufficiali.

Interventi che farei prima della diffusione

Minimo indispensabile:

aggiungere la nota “strumento indicativo”;

Subito dopo:

verificare i 198 anelli eliminati;
controllare sovrapposizioni e vuoti tra i dodici comuni catastali;
testare click dentro/fuori su tutti i tratti di confine.
Checklist manuale compatta
Avvio e interfaccia
 Apertura da iPhone/Safari e Android/Chrome su HTTPS.
 Satellitare, confine rosso e maschera visibili all’avvio.
 Attivazione/disattivazione dei due overlay senza errori.
 Cambio Satellite/Stradale/Satellite Esri corretto.
 Reset riporta all’intero territorio di Melegnano.
 Nessun rallentamento evidente su telefono meno recente.
Click sulla mappa
 Punto centrale di Melegnano → Comune di Melegnano.
 Un punto certo per ciascun comune confinante → nome corretto.
 Secondo click sullo stesso comune → evidenziazione rimossa.
 Passaggio tra due comuni diversi → evidenziazione aggiornata.
 Click immediatamente dentro e fuori ciascun tratto di confine.
 Click esattamente sulla linea → risultato non fuorviante.
 Click nei vuoti tra geometrie catastali → niente comune errato.
 Click lontano dall’area catastale → fallback ISTAT corretto.
GPS
 Permesso concesso → marker e accuratezza visualizzati.
 Permesso negato → messaggio comprensibile.
 GPS dentro Melegnano, lontano dal confine → risultato stabile.
 GPS fuori Melegnano, lontano dal confine → risultato stabile.
 GPS vicino al confine → dentro o sulla linea catastale restituisce Melegnano.
 “Segui posizione” si attiva e disattiva correttamente.
 Spostamento lungo il confine → niente alternanza presentata come certezza.
 Schermo bloccato/riaperto → il follow non rimane in uno stato UI incoerente.
Punti operativi da provare sul posto
 Principali accessi stradali a Melegnano.
 Rotatorie e intersezioni attraversate dal confine.
 Ponti, corsi d’acqua, rampe e pertinenze stradali vicine al limite.
 Almeno 2–3 punti in cui catastale e vecchio confine ISTAT differiscono.
 Un punto con accuratezza buona, uno mediocre e uno superiore a 30 metri.

Conclusione: la mappa e adeguata come test interno della regola operativa corrente. La verifica decisiva resta il confronto sul posto nei tratti in cui catastale e vecchio confine ISTAT differiscono.

## Debugging corrente

Stato: in corso.

Regola confermata:

- dentro il confine catastale operativo di Melegnano: Melegnano;
- sulla linea catastale operativa: Melegnano;
- fuori dal confine catastale operativo: Melegnano non puo essere restituito dai fallback;
- fuori Melegnano, la mappa usa comuni catastali locali e poi ISTAT solo come fallback non-Melegnano.

Verifiche automatiche gia eseguite:

- `node --check js/map.js`: ok;
- centro Melegnano: Melegnano;
- punto sulla linea catastale: Melegnano;
- punto certo su Carpiano: Carpiano;
- campionamento lungo il perimetro catastale: 79 punti esterni testati, 0 restituiti come Melegnano;
- vecchio messaggio "Posizione prossima al confine": assente.
- suite browser desktop/mobile: nessun errore console o page error;
- click simulati su centro Melegnano, linea catastale, Carpiano e San Donato Milanese: ok;
- toggle overlay, maschera e cambio basemap: ok;
- layout mobile: corrette sovrapposizioni tra toolbar, zoom e attribuzione Leaflet;
- favicon inline aggiunto per eliminare il 404 in console;
- cache-bust aggiornato per `css/map.css` e `js/map.js`.

Da proseguire:

- test click manuali nei tratti in cui catastale e vecchio ISTAT differiscono;
- test su mobile/HTTPS della geolocalizzazione;
- eventuale verifica dei punti segnalati dall'utente, se disponibili come coordinate o screenshot.

## Ortofoto Lombardia 2024

Stato: integrata come base predefinita.

Servizio ufficiale verificato:

- metadato Geoportale: `r_lombar:bca4e4bb-88fe-4683-8ace-8330a5f403a6`;
- access point ufficiale: viewer Regione Lombardia `config_HP_orto2024.json`;
- servizio effettivo usato dal viewer: `https://www.cartografia.servizirl.it/arcgis5/rest/services/BaseMap/Ortofoto2024/ImageServer`;
- WMS usato in Leaflet: `https://www.cartografia.servizirl.it/arcgis5/services/BaseMap/Ortofoto2024/ImageServer/WMSServer`;
- layer WMS: `0`;
- titolo layer: `Ortofoto2024`;
- formato: `image/png`;
- versione WMS: `1.3.0`;
- CRS richiesto dal layer Leaflet WMS: `EPSG:4326`;
- WMTS verificato ma non usato perche pubblicato solo su `EPSG:7791`, non compatibile con normale griglia XYZ/Web Mercator;
- CORS verificato con origin GitHub Pages: ok;
- HTTPS verificato: ok;
- attribuzione inserita: `Ortofoto AGEA 2024 - Regione Lombardia, copyright AGEA - licenza d'uso concessa a Regione Lombardia`.

Comportamento:

- base predefinita: `Satellite` = Ortofoto Lombardia 2024;
- alternative selezionabili: `Stradale` = CARTO Voyager, `Satellite Esri` = Esri World Imagery;
- fallback automatico su `Satellite Esri` dopo errori ripetuti di tile del WMS regionale.

Verifiche eseguite:

- `GetCapabilities` WMS: ok;
- `GetCapabilities` WMTS: ok, ma solo `EPSG:7791`;
- `GetMap` WMS su area Melegnano: PNG reale restituito;
- pagina locale: Ortofoto Lombardia caricata all'avvio con 30 tile WMS `200 image/png`;
- radio base e layer attivo coerenti;
- cambi base `Satellite`, `Stradale`, `Satellite Esri` in entrambe le direzioni: ok;
- una sola base attiva alla volta: ok;
- confine catastale, maschera, marker GPS, accuratezza e comune selezionato preservati durante il cambio base;
- fallback simulato dopo soglia errori tile: passa una sola volta a `Satellite Esri`, aggiorna radio e messaggio stato;
- console browser desktop: nessun errore;
- vista centrata su Melegnano: ok.
