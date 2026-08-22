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
- Rimosso il tooltip hover sul confine di Melegnano.
- Uniformato il click su Melegnano aggiornando il box stato e aggiunta evidenziazione blu del Comune cliccato fuori confine.
- Scurita leggermente la maschera esterna del layer di evidenziazione Melegnano.

## 2026-08-22

- Aggiunti overlay WMS catastali disattivabili per strade, particelle, mappe/fogli, fabbricati e acque.
- Mantenuti disattivati di default i nuovi overlay per preservare l'usabilita attuale della mappa.
- Verificato il WMS MASE dei confini comunali 2020: al momento restituisce errore server, quindi non e stato esposto nella UI.
- Aggiunto dataset locale dei fogli catastali Melegnano `F100` da 1 a 16 da WFS Agenzia Entrate.
- Impostati i fogli catastali come confine operativo rosso, acceso di default.
- Spenti di default il vecchio confine ISTAT e la maschera overlay.
- Agganciata la verifica dentro/fuori Comune alla geometria composita dei fogli catastali.
- Aggiunto layer WMS `codice_plla` per numeri particelle/fabbricati, spento di default.
- Spostati i numeri dei fogli catastali nel layer "Numeri particelle/fabbricati".
- Aggiunto perimetro catastale dissolto dei fogli `F100` 1-16 per maschera ed evidenziazione del territorio.
- Aggiunto dataset dei comuni catastali nell'area di Melegnano per identificare il comune corretto al click.
- Aggiunta disattivazione dell'evidenziazione quando si riclicca lo stesso comune selezionato.
- Rimossi i filtri catastali `Strade catastali` e `Acque`.
- Spostato il layer WMS dei numeri catastali sopra i vettoriali per migliorarne la visibilita.
- Rifinito il rendering del confine catastale rimuovendo i fill trasparenti e arrotondando le giunzioni della linea.
- Nascosti i confini interni dei fogli catastali dalla resa principale, mantenendo visibile solo il perimetro catastale esterno.
- Rimossi gli anelli interni dal perimetro catastale usato per visualizzazione, maschera e dentro/fuori, evitando tratti di linea sovrapposti o con spessore non uniforme.
- Rimossi i filtri `Particelle`, `Numeri particelle/fabbricati` e `Fabbricati`, insieme ai riferimenti WMS non piu necessari.
- Spostato `Confine catastale Melegnano` negli overlay e acceso di default insieme a `Evidenzia territorio comunale`.
- Rimosso definitivamente il layer `Confine comunale ISTAT` dalla UI e dal codice.
- Rimossi i file `data/melegnano.geojson` e `data/melegnano.js`, non piu usati a runtime.
- Data priorita al perimetro catastale di Melegnano nel riconoscimento al click, prima degli altri comuni catastali e del fallback ISTAT.
- Disattivato il fallback ISTAT dentro la copertura catastale locale per evitare identificazioni incoerenti vicino ai confini.
- Integrata l'Ortofoto Lombardia 2024 ufficiale come base WMS predefinita.
- Mantenuti CARTO Voyager come base stradale ed Esri World Imagery come base satellitare alternativa.
- Aggiunto fallback automatico una sola volta da Ortofoto Lombardia 2024 a Esri World Imagery dopo errori ripetuti di tile.
- Rimossa l'Ortofoto Lombardia 2024 dalla UI per tempi di caricamento iniziale non adeguati.
- Ripristinata Esri World Imagery come base satellitare predefinita.
- Ridotto il selettore basi a due radio mutuamente esclusivi: `Satellite` Esri e `Stradale` CARTO Voyager.
