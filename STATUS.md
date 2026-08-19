# Stato Progetto

## MVP web map

Stato: prima versione funzionante locale.

Completato:

- struttura progetto statica;
- Leaflet con basemap stradale CARTO Voyager senza chiavi;
- basemap satellitare attiva di default;
- Leaflet incluso localmente in `vendor/leaflet/`;
- apertura diretta di `index.html` senza fetch del GeoJSON;
- centro iniziale su Melegnano;
- confine comunale ISTAT non generalizzato in GeoJSON;
- maschera semitrasparente sull'area esterna;
- pulsante "La mia posizione";
- marker posizione utente;
- cerchio di accuratezza GPS;
- verifica dentro/fuori Comune via point-in-polygon client-side;
- modalita "Segui posizione";
- reset vista;
- scala metrica dinamica;
- menu layer minimo;
- selettore basemap stradale/satellitare;
- basemap Esri World Street Map come alternativa stradale;
- layout mobile-first.

Da verificare su HTTPS:

- geolocalizzazione da iPhone/Safari;
- geolocalizzazione da Android/Chrome;
- prestazioni e leggibilita su schermi piccoli.

Non ancora fatto:

- attivazione GitHub Pages dal repository;
- progetto QGIS/PDF.
