# Vector Map

Mappa operativa statica del Comune di Melegnano, pensata per consultazione rapida da desktop e smartphone.

## Cosa fa

- apre la mappa centrata su Melegnano;
- mostra il confine comunale;
- evidenzia il territorio comunale con una maschera sull'area esterna;
- usa Tracestrack Topo come cartografia predefinita se e configurata una API key;
- usa CARTO Voyager come fallback se manca la API key Tracestrack;
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
│   ├── melegnano.geojson
│   └── melegnano.js
├── vendor/
│   └── leaflet/
├── config.example.js
├── assets/
└── qgis/
```

## Fonti cartografiche

- Confine comunale: ISTAT, Confini amministrativi 2022 non generalizzati, Comuni WGS84 / UTM Zone 32N, codice Comune `015140`.
- Basemap preferita: Tracestrack Topo, con API key configurabile.
- Fallback stradale: CARTO Voyager, basato su dati OpenStreetMap.
- Basemap satellitare: Esri World Imagery.
- Libreria web map: Leaflet 1.9.4, inclusa localmente in `vendor/leaflet/`.

## Configurare Tracestrack

Per usare Tracestrack Topo come layer predefinito, creare un file locale `config.js` partendo da `config.example.js`:

```js
window.VECTOR_MAP_CONFIG = {
  tracestrackKey: "LA_TUA_KEY",
};
```

`config.js` e escluso da Git per evitare di pubblicare chiavi nel repository. Su GitHub Pages, una chiave frontend e comunque visibile al browser: va quindi limitata dal pannello Tracestrack al dominio `fivefingerhand.github.io`.

In alternativa, per provare il layer su GitHub Pages senza aggiungere `config.js` al repo, aprire una volta:

```text
https://fivefingerhand.github.io/vector_map/?tracestrack_key=LA_TUA_KEY
```

La chiave viene salvata nel `localStorage` del browser. Per un link pubblico stabile, la soluzione corretta resta una key Tracestrack limitata al dominio GitHub Pages.

File sorgente ISTAT usato per la conversione:

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

1. scaricare un archivio ISTAT piu recente dei confini amministrativi;
2. estrarre il Comune con codice `015140`;
3. sostituire `data/melegnano.geojson`;
4. verificare la mappa e la funzione dentro/fuori Comune.

## PDF

La parte PDF non e inclusa nell'MVP web. La strada consigliata e creare un progetto QGIS in `qgis/` con:

- confine comunale evidenziato;
- basemap o dati vettoriali adatti alla stampa;
- layout A4/A3;
- esportazione PDF vettoriale.
