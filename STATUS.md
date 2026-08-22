# Stato Progetto

## MVP web map

Stato: prima versione funzionante locale.

Completato:

- struttura progetto statica;
- Leaflet con varianti CARTO senza chiavi;
- basemap satellitare attiva di default;
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
- selettore basemap stradale/satellitare;
- confine operativo basato sui fogli catastali Melegnano `F100` da 1 a 16;
- maschera e verifica dentro/fuori basate sui fogli catastali Melegnano;
- riconoscimento dei comuni nell'area di Melegnano basato sui fogli catastali WFS raggruppati per comune;
- click ripetuto sullo stesso comune selezionato per disattivare l'evidenziazione;
- layout mobile-first.

Da verificare su HTTPS:

- geolocalizzazione da iPhone/Safari;
- geolocalizzazione da Android/Chrome;
- prestazioni e leggibilita su schermi piccoli.

Non ancora fatto:

- attivazione GitHub Pages dal repository;
- progetto QGIS/PDF.
- overlay MASE dei confini comunali: il WMS testato risponde con errore server del Geoportale.
