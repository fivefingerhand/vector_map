# Changelog

## 2026-08-19

- Creata prima versione statica della web map `vector_map`.
- Aggiunto confine comunale di Melegnano da ISTAT, codice `015140`.
- Aggiunta mappa Leaflet con OpenStreetMap.
- Aggiunta maschera esterna al Comune.
- Aggiunta geolocalizzazione client-side con accuratezza GPS.
- Aggiunta verifica dentro/fuori Comune.
- Aggiunti controlli mobile per posizione, follow GPS, reset vista e layer.
- Aggiunta documentazione iniziale.
- Sostituito il layer tile predefinito con CARTO Voyager per evitare blocchi sulle tile OSM standard.
- Aggiunto `data/melegnano.js` per consentire l'apertura diretta di `index.html`.
- Inclusa localmente la libreria Leaflet 1.9.4.
- Aggiunte regole CSS critiche di fallback per evitare tile disordinate se il CSS Leaflet resta in cache o non viene letto subito.
- Disattivato il fade delle tile durante il caricamento.
- Sostituito il confine ISTAT generalizzato con il confine ISTAT non generalizzato del Comune `015140`.
- Aggiunto selettore basemap con livello stradale e livello satellitare Esri World Imagery.
- Aggiunta configurazione minima per GitHub Pages con `.nojekyll`.
- Aggiunta scala metrica dinamica vicino ai controlli zoom.
- Mantenuti solo layer senza chiavi: CARTO Voyager per stradale ed Esri World Imagery per satellitare.
- Impostata la basemap satellitare come visualizzazione predefinita.
- Rimossa Esri World Street Map.
- Aggiunte varianti CARTO: Voyager, Voyager no nomi, Chiara, Chiara no nomi, Scura, Scura no nomi.
- Ridotto il README pubblico e spostata la documentazione estesa in un README interno non tracciato.
- Ridotto il selettore basemap a Voyager con nomi e Satellitare.
- Aggiunto dataset locale dei Comuni vicini e popup sul click fuori Melegnano con il Comune di appartenenza.
