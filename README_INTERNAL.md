# Vector Map

Mappa operativa statica del Comune di Melegnano, pensata per consultazione rapida da desktop e smartphone.

## Cosa fa

- apre la mappa centrata su Melegnano;
- mostra il confine catastale comunale di Melegnano;
- evidenzia il territorio comunale con una maschera sull'area esterna;
- include piu varianti CARTO, basate su dati OpenStreetMap, senza chiavi;
- consente di passare dalla basemap stradale alla basemap satellitare;
- include Leaflet in locale, senza dipendere da CDN per il codice della mappa;
- consente zoom, pan e reset vista;
- mostra la posizione GPS dell'utente e il raggio di accuratezza;
- indica se la posizione rilevata e dentro o fuori dal Comune di Melegnano;
- funziona client-side, senza backend, login, cookie o tracciamento.

La mappa puo essere aperta anche direttamente da `index.html`. La geolocalizzazione richiede HTTPS, oppure `localhost` durante lo sviluppo.

## Struttura

```text
vector_map/
├── README.md
├── STATUS.md
├── CHANGELOG.md
├── index.html
├── css/
│   └── map.css
├── js/
│   └── map.js
├── data/
│   ├── cadastral_boundary_melegnano.geojson
│   ├── cadastral_boundary_melegnano.js
│   ├── cadastral_municipalities_melegnano_area.geojson
│   ├── cadastral_municipalities_melegnano_area.js
│   ├── municipalities.geojson
│   └── municipalities.js
├── vendor/
│   └── leaflet/
├── assets/
└── qgis/
```

## Fonti cartografiche

- Confine comunale operativo: Agenzia Entrate WFS `CP:CadastralZoning`, fogli catastali Melegnano `F100` da 1 a 16, dissolti in un perimetro unico.
- Comuni catastali area Melegnano: Agenzia Entrate WFS `CP:CadastralZoning`, fogli raggruppati per codice catastale comunale.
- Fallback nomi/comuni fuori copertura catastale locale: ISTAT, Confini amministrativi 2022 non generalizzati, Comuni WGS84 / UTM Zone 32N.
- Basemap stradali: varianti CARTO Voyager/Positron/Dark Matter, basate su dati OpenStreetMap.
- Basemap satellitare: Esri World Imagery.
- Libreria web map: Leaflet 1.9.4, inclusa localmente in `vendor/leaflet/`.

Servizio catastale usato per il perimetro operativo:

`https://wfs.cartografia.agenziaentrate.gov.it/inspire/wfs/owfs01.php?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=2.0.0`

File sorgente ISTAT usato solo per il fallback dei comuni locali:

`https://www.istat.it/storage/cartografia/confini_amministrativi/non_generalizzati/Limiti01012022.zip`

## Avvio locale

Da questa cartella:

```bash
python3 -m http.server 8080
```

Poi aprire:

```text
http://localhost:8080/
```

## Pubblicazione GitHub Pages

Il progetto e composto da file statici e puo essere pubblicato direttamente con GitHub Pages.

Impostazioni consigliate nel repository GitHub:

```text
Settings -> Pages
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

Il sito sara disponibile a un URL simile a:

```text
https://fivefingerhand.github.io/vector_map/
```

La geolocalizzazione funziona perche GitHub Pages serve il sito in HTTPS.

## Aggiornamento confine

Quando serve aggiornare il confine:

1. interrogare il WFS Agenzia Entrate `CP:CadastralZoning` sull'area di Melegnano;
2. filtrare i fogli catastali del Comune `F100` da 1 a 16;
3. dissolvere i fogli in un perimetro unico senza anelli interni per `data/cadastral_boundary_melegnano.geojson`;
4. raggruppare i fogli catastali dell'area per codice catastale comunale per `data/cadastral_municipalities_melegnano_area.geojson`;
5. aggiornare anche i rispettivi file `.js` per consentire l'apertura diretta di `index.html`;
6. verificare mappa, evidenziazione, geolocalizzazione e click sui comuni confinanti.

## PDF

La parte PDF non e inclusa nell'MVP web. La strada consigliata e creare un progetto QGIS in `qgis/` con:

- confine comunale evidenziato;
- basemap o dati vettoriali adatti alla stampa;
- layout A4/A3;
- esportazione PDF vettoriale.
