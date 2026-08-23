const MELEGNANO_CENTER = [45.3562426686416, 9.307885207235815];
const INITIAL_ZOOM = 14;
const CADASTRAL_BOUNDARY_DATA_URL = "data/cadastral_boundary_melegnano.geojson";
const CADASTRAL_MUNICIPALITIES_DATA_URL = "data/cadastral_municipalities_melegnano_area.geojson";
const MUNICIPALITIES_DATA_URL = "data/municipalities.geojson";
const BOUNDARY_LINE_TOLERANCE_METERS = 0.01;
const LOCAL_CADASTRAL_NEAREST_METERS = 80;

const map = L.map("map", {
  zoomControl: false,
  preferCanvas: true,
  fadeAnimation: false,
}).setView(MELEGNANO_CENTER, INITIAL_ZOOM);

L.control.zoom({ position: "bottomright" }).addTo(map);
L.control.scale({ position: "bottomleft", metric: true, imperial: false }).addTo(map);

const baseLayers = {
  satellite: L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution:
        "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    }
  ),
  roadVoyager: createCartoLayer("voyager"),
  roadOsm: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    subdomains: "abc",
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }),
};

let activeBaseLayer = baseLayers.satellite.addTo(map);
let activeBaseLayerKey = "satellite";

function createCartoLayer(style, options = {}) {
  return L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/${style}/{z}/{x}/{y}{r}.png`, {
    subdomains: "abcd",
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    ...options,
  });
}

const statusPanel = document.getElementById("statusPanel");
const locationStatus = document.getElementById("locationStatus");
const locateButton = document.getElementById("locateButton");
const followButton = document.getElementById("followButton");
const copyCoordinateButton = document.getElementById("copyCoordinateButton");
const resetButton = document.getElementById("resetButton");
const layerToggleButton = document.getElementById("layerToggleButton");
const layerQuickPanel = document.getElementById("layerQuickPanel");
const openLayerDetailsButton = document.getElementById("openLayerDetailsButton");
const layerDetailsPanel = document.getElementById("layerDetailsPanel");
const backToBaseLayersButton = document.getElementById("backToBaseLayersButton");
const closeLayerDetailsButton = document.getElementById("closeLayerDetailsButton");
const baseTileButtons = document.querySelectorAll("[data-base-layer]");
const overlayTileButtons = document.querySelectorAll("[data-overlay-layer]");
const measureToolButton = document.getElementById("measureToolButton");
const measureHud = document.getElementById("measureHud");
const measureHudDistance = document.getElementById("measureHudDistance");
const finishMeasureButtons = document.querySelectorAll(".finish-measure-action");
const clearMeasureButtons = document.querySelectorAll(".clear-measure-action");

let municipalityFeature;
let municipalityFeatures = [];
let cadastralMunicipalityFeatures = [];
let maskLayer;
let cadastralZoningLayer;
let cadastralBoundaryLayer;
let selectedMunicipalityLayer;
let selectedMunicipalityKey = null;
let userMarker;
let accuracyCircle;
let watchId = null;
let copyTarget = null;
let measureLayer;
let measureLine;
let measurePoints = [];
let measureTotalMeters = 0;
let lastMeasureClick = null;

const uiState = {
  quickPanelOpen: false,
  detailsPanelOpen: false,
  overlays: {
    cadastralZoning: true,
    mask: true,
  },
  measureActive: false,
};

const userIcon = L.divIcon({
  className: "",
  html: '<div class="user-location-marker" aria-hidden="true"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

init();

async function init() {
  try {
    const [
      cadastralBoundaryGeojson,
      cadastralMunicipalitiesGeojson,
      municipalitiesGeojson,
    ] =
      await Promise.all([
        window.MELEGNANO_CADASTRAL_BOUNDARY_GEOJSON || loadGeojson(CADASTRAL_BOUNDARY_DATA_URL),
        window.CADASTRAL_MUNICIPALITIES_MELEGNANO_AREA_GEOJSON ||
          loadGeojson(CADASTRAL_MUNICIPALITIES_DATA_URL),
        window.MUNICIPALITIES_GEOJSON || loadGeojson(MUNICIPALITIES_DATA_URL),
      ]);

    const cadastralBoundaryDisplayGeojson = stripInteriorRingsFromFeatureCollection(
      cadastralBoundaryGeojson
    );
    const cadastralMunicipalitiesDisplayGeojson = stripInteriorRingsFromFeatureCollection(
      cadastralMunicipalitiesGeojson
    );

    municipalityFeature = cadastralBoundaryDisplayGeojson.features[0];
    cadastralMunicipalityFeatures = cadastralMunicipalitiesDisplayGeojson.features || [];
    municipalityFeatures = municipalitiesGeojson.features || [];

    cadastralBoundaryLayer = L.geoJSON(cadastralBoundaryDisplayGeojson, {
      style: {
        color: "#b91c1c",
        weight: 4,
        opacity: 1,
        fill: false,
        lineCap: "round",
        lineJoin: "round",
      },
    });

    cadastralZoningLayer = L.layerGroup([cadastralBoundaryLayer]).addTo(map);

    maskLayer = L.polygon(buildOutsideMask(municipalityFeature.geometry), {
      stroke: false,
      fillColor: "#1f2933",
      fillOpacity: 0.32,
      interactive: false,
    });
    if (uiState.overlays.mask) maskLayer.addTo(map);
    bringCadastralZoningToFront();
    syncLayerUi();

    map.fitBounds(cadastralBoundaryLayer.getBounds(), { padding: [22, 22] });
    map.setZoom(Math.max(map.getZoom(), INITIAL_ZOOM));
  } catch (error) {
    console.error(error);
    setStatus("Errore nel caricamento del confine comunale", true);
  }
}

async function loadGeojson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`GeoJSON non caricato: ${response.status}`);
  return response.json();
}

locateButton.addEventListener("click", () => locateOnce());

followButton.addEventListener("click", () => {
  if (watchId === null) {
    startFollowing();
  } else {
    stopFollowing("Aggiornamento posizione disattivato");
  }
});

copyCoordinateButton.addEventListener("click", async () => {
  if (!copyTarget) return;

  const text = formatCoordinate(copyTarget.latlng);
  try {
    await copyText(text);
    setStatus(`${copyTarget.label} copiate: ${text}`, copyTarget.isOutside);
  } catch (error) {
    console.error(error);
    setStatus("Copia coordinate non riuscita", true);
  }
});

resetButton.addEventListener("click", () => {
  if (cadastralBoundaryLayer) {
    map.fitBounds(cadastralBoundaryLayer.getBounds(), { padding: [22, 22] });
  } else {
    map.setView(MELEGNANO_CENTER, INITIAL_ZOOM);
  }
});

layerToggleButton.addEventListener("click", () => {
  setQuickPanelOpen(!uiState.quickPanelOpen);
});

baseTileButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setBaseLayer(button.dataset.baseLayer);
  });
});

openLayerDetailsButton.addEventListener("click", () => {
  openDetailsPanel();
});

backToBaseLayersButton.addEventListener("click", () => {
  setQuickPanelOpen(true);
});

closeLayerDetailsButton.addEventListener("click", () => {
  closeLayerPanels();
});

overlayTileButtons.forEach((button) => {
  button.addEventListener("click", () => {
    toggleOverlay(button.dataset.overlayLayer);
  });
});

measureToolButton.addEventListener("click", () => {
  setMeasureActive(!uiState.measureActive);
});

finishMeasureButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMeasureActive(false);
  });
});

clearMeasureButtons.forEach((button) => {
  button.addEventListener("click", () => {
    clearMeasure();
  });
});

document.addEventListener("pointerdown", (event) => {
  if (
    (!uiState.quickPanelOpen && !uiState.detailsPanelOpen) ||
    layerQuickPanel.contains(event.target) ||
    layerDetailsPanel.contains(event.target) ||
    layerToggleButton.contains(event.target)
  ) {
    return;
  }

  closeLayerPanels();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (uiState.detailsPanelOpen || uiState.quickPanelOpen) closeLayerPanels();
});

map.on("click", (event) => {
  if (uiState.measureActive) {
    addMeasurePoint(event.latlng);
    return;
  }

  if (!municipalityFeature || municipalityFeatures.length === 0) return;

  const point = [event.latlng.lng, event.latlng.lat];
  const feature = findClickedMunicipality(point);

  const message = feature ? `Comune di ${feature.properties.name}` : "Comune non disponibile";
  const isOutside =
    !feature ||
    feature.properties.administrative_unit !== municipalityFeature.properties.administrative_unit;
  setCopyTarget(event.latlng, "punto", isOutside);
  setStatus(message, isOutside);

  if (!feature || feature.properties.administrative_unit === municipalityFeature.properties.administrative_unit) {
    clearSelectedMunicipality();
    map.closePopup();
    return;
  }

  const featureKey = municipalityKey(feature);
  if (featureKey && featureKey === selectedMunicipalityKey) {
    clearSelectedMunicipality();
    map.closePopup();
    return;
  }

  showSelectedMunicipality(feature);

  L.popup({ closeButton: false })
    .setLatLng(event.latlng)
    .setContent(`<strong>${escapeHtml(message)}</strong>`)
    .openOn(map);
});

map.on("dblclick", (event) => {
  if (!uiState.measureActive) return;
  L.DomEvent.stop(event);
  setMeasureActive(false);
});

function findClickedMunicipality(point) {
  if (
    isPointInGeometry(point, municipalityFeature.geometry) ||
    distanceToGeometryBoundaryMeters(point, municipalityFeature.geometry) <=
      BOUNDARY_LINE_TOLERANCE_METERS
  ) {
    return municipalityFeature;
  }

  const cadastralMatches = cadastralMunicipalityFeatures.filter((candidate) =>
    isPointInGeometry(point, candidate.geometry)
  );

  if (cadastralMatches.length > 1) return closestFeatureByBoundaryDistance(point, cadastralMatches);

  if (cadastralMatches.length === 1) return cadastralMatches[0];

  const nearestCadastralFeature = closestFeatureByBoundaryDistance(
    point,
    cadastralMunicipalityFeatures.filter(
      (candidate) => !isMelegnanoOperationalFeature(candidate)
    )
  );
  const nearestCadastralDistance = nearestCadastralFeature
    ? distanceToGeometryBoundaryMeters(point, nearestCadastralFeature.geometry)
    : Infinity;
  if (nearestCadastralDistance <= LOCAL_CADASTRAL_NEAREST_METERS) return nearestCadastralFeature;

  const fallbackFeature = municipalityFeatures.find((candidate) =>
    isPointInGeometry(point, candidate.geometry)
  );
  if (!fallbackFeature || isMelegnanoName(fallbackFeature)) return null;
  return fallbackFeature;
}

function closestFeatureByBoundaryDistance(point, features) {
  let closestFeature = null;
  let closestDistance = Infinity;

  features.forEach((feature) => {
    const distance = distanceToGeometryBoundaryMeters(point, feature.geometry);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestFeature = feature;
    }
  });

  return closestFeature;
}

function showSelectedMunicipality(feature) {
  clearSelectedMunicipality();
  selectedMunicipalityKey = municipalityKey(feature);

  selectedMunicipalityLayer = L.geoJSON(feature, {
    style: {
      color: "#1d4ed8",
      weight: 2,
      opacity: 0.9,
      fillColor: "#2563eb",
      fillOpacity: 0.24,
    },
    interactive: false,
  }).addTo(map);

  if (map.hasLayer(cadastralZoningLayer)) bringCadastralZoningToFront();
}

function clearSelectedMunicipality() {
  if (selectedMunicipalityLayer) map.removeLayer(selectedMunicipalityLayer);
  selectedMunicipalityLayer = null;
  selectedMunicipalityKey = null;
}

function municipalityKey(feature) {
  return feature.properties.administrative_unit || feature.properties.istat_code || feature.properties.name;
}

function isMelegnanoOperationalFeature(feature) {
  return (
    municipalityFeature &&
    municipalityKey(feature) === municipalityKey(municipalityFeature)
  );
}

function isMelegnanoName(feature) {
  return feature.properties.name?.toLowerCase() === "melegnano";
}

function stripInteriorRingsFromFeatureCollection(featureCollection) {
  return {
    ...featureCollection,
    features: featureCollection.features.map((feature) => ({
      ...feature,
      geometry: stripInteriorRings(feature.geometry),
    })),
  };
}

function stripInteriorRings(geometry) {
  if (geometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.length > 0 ? [geometry.coordinates[0]] : [],
    };
  }

  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon) => (polygon.length > 0 ? [polygon[0]] : [])),
    };
  }

  return geometry;
}

function bringCadastralZoningToFront() {
  if (cadastralBoundaryLayer) cadastralBoundaryLayer.bringToFront();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function locateOnce() {
  if (!navigator.geolocation) {
    setStatus("Geolocalizzazione non supportata dal browser", true);
    return;
  }

  locateButton.disabled = true;
  setStatus("Ricerca posizione in corso...");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      locateButton.disabled = false;
      updateUserLocation(position, true);
    },
    (error) => {
      locateButton.disabled = false;
      setStatus(geolocationErrorMessage(error), true);
    },
    geolocationOptions()
  );
}

function startFollowing() {
  if (!navigator.geolocation) {
    setStatus("Geolocalizzazione non supportata dal browser", true);
    return;
  }

  followButton.setAttribute("aria-pressed", "true");
  setStatus("Aggiornamento posizione attivo");

  watchId = navigator.geolocation.watchPosition(
    (position) => updateUserLocation(position, true),
    (error) => {
      stopFollowing(geolocationErrorMessage(error), true);
    },
    geolocationOptions()
  );
}

function stopFollowing(message, isError = false) {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  followButton.setAttribute("aria-pressed", "false");
  if (message) setStatus(message, isError);
}

function updateUserLocation(position, centerMap) {
  const latlng = [position.coords.latitude, position.coords.longitude];
  const accuracy = position.coords.accuracy;

  if (!userMarker) {
    userMarker = L.marker(latlng, { icon: userIcon, keyboard: false }).addTo(map);
  } else {
    userMarker.setLatLng(latlng);
  }

  if (!accuracyCircle) {
    accuracyCircle = L.circle(latlng, {
      radius: accuracy,
      stroke: true,
      color: "#2563eb",
      weight: 1,
      opacity: 0.7,
      fillColor: "#60a5fa",
      fillOpacity: 0.18,
    }).addTo(map);
  } else {
    accuracyCircle.setLatLng(latlng);
    accuracyCircle.setRadius(accuracy);
  }

  if (centerMap) {
    map.setView(latlng, Math.max(map.getZoom(), 16), { animate: true });
  }

  const point = [latlng[1], latlng[0]];
  const inside = municipalityFeature
    ? isPointInGeometry(point, municipalityFeature.geometry) ||
      distanceToGeometryBoundaryMeters(point, municipalityFeature.geometry) <=
        BOUNDARY_LINE_TOLERANCE_METERS
    : null;

  setCopyTarget(L.latLng(latlng[0], latlng[1]), "gps", inside === false);

  if (inside === null) {
    setStatus(`Posizione rilevata, accuratezza circa ${Math.round(accuracy)} m`);
  } else {
    setStatus(
      `${inside ? "Comune di Melegnano" : "Fuori Comune"} - accuratezza circa ${Math.round(accuracy)} m`,
      !inside
    );
  }
}

function geolocationOptions() {
  return {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 5000,
  };
}

function geolocationErrorMessage(error) {
  if (error.code === error.PERMISSION_DENIED) return "Permesso posizione negato";
  if (error.code === error.POSITION_UNAVAILABLE) return "Posizione non disponibile";
  if (error.code === error.TIMEOUT) return "Tempo scaduto nella ricerca posizione";
  return "Errore geolocalizzazione";
}

function setStatus(message, isOutside = false) {
  locationStatus.textContent = message;
  statusPanel.classList.toggle("is-outside", isOutside);
}

function setQuickPanelOpen(open) {
  uiState.quickPanelOpen = open;
  uiState.detailsPanelOpen = false;
  layerQuickPanel.hidden = !open;
  layerDetailsPanel.hidden = true;
  layerToggleButton.setAttribute("aria-expanded", String(open));
  layerToggleButton.setAttribute(
    "aria-label",
    open ? "Chiudi selezione livelli" : "Apri selezione livelli"
  );
  if (open) syncLayerUi();
}

function openDetailsPanel() {
  uiState.quickPanelOpen = false;
  uiState.detailsPanelOpen = true;
  layerQuickPanel.hidden = true;
  layerDetailsPanel.hidden = false;
  layerToggleButton.setAttribute("aria-expanded", "true");
  layerToggleButton.setAttribute("aria-label", "Chiudi selezione livelli");
  syncLayerUi();
}

function closeLayerPanels() {
  uiState.quickPanelOpen = false;
  uiState.detailsPanelOpen = false;
  layerQuickPanel.hidden = true;
  layerDetailsPanel.hidden = true;
  layerToggleButton.setAttribute("aria-expanded", "false");
  layerToggleButton.setAttribute("aria-label", "Apri selezione livelli");
}

function syncLayerUi() {
  baseTileButtons.forEach((button) => {
    const selected = button.dataset.baseLayer === activeBaseLayerKey;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute(
      "aria-label",
      `${button.querySelector(".tile-name").textContent}${selected ? ", base attiva" : ""}`
    );
  });

  overlayTileButtons.forEach((button) => {
    const active = Boolean(uiState.overlays[button.dataset.overlayLayer]);
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
  });

  measureToolButton.classList.toggle("is-selected", uiState.measureActive);
  measureToolButton.setAttribute("aria-pressed", String(uiState.measureActive));
  measureHud.hidden = !uiState.measureActive && measurePoints.length === 0;
  const formattedDistance = formatDistance(measureTotalMeters);
  measureHudDistance.textContent = formattedDistance;
  document.body.classList.toggle("is-measuring", uiState.measureActive);
}

function setCopyTarget(latlng, source, isOutside = false) {
  copyTarget = {
    latlng,
    label: source === "gps" ? "Coordinate GPS" : "Coordinate punto",
    isOutside,
  };

  copyCoordinateButton.disabled = false;
  copyCoordinateButton.classList.add("copy-ready");
  copyCoordinateButton.textContent = source === "gps" ? "Copia GPS" : "Copia punto";
}

function formatCoordinate(latlng) {
  return `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const copied = document.execCommand("copy");
    if (!copied) throw new Error("document.execCommand copy failed");
  } finally {
    document.body.removeChild(textarea);
  }
}

function setLayerVisibility(layer, visible) {
  if (!layer) return;
  if (visible) {
    if (!map.hasLayer(layer)) layer.addTo(map);
  } else {
    if (map.hasLayer(layer)) map.removeLayer(layer);
  }
}

function toggleOverlay(layerName) {
  if (!(layerName in uiState.overlays)) return;

  uiState.overlays[layerName] = !uiState.overlays[layerName];
  const layer = layerName === "cadastralZoning" ? cadastralZoningLayer : maskLayer;
  setLayerVisibility(layer, uiState.overlays[layerName]);
  if (uiState.overlays.cadastralZoning) bringCadastralZoningToFront();
  if (selectedMunicipalityLayer) selectedMunicipalityLayer.bringToFront();
  syncLayerUi();
}

function setBaseLayer(layerName, options = {}) {
  const nextLayer = baseLayers[layerName];
  if (!nextLayer) return;

  if (nextLayer === activeBaseLayer) {
    if (!options.keepQuickPanelOpen) closeLayerPanels();
    syncLayerUi();
    return;
  }

  activeBaseLayer.setOpacity(1);
  map.removeLayer(activeBaseLayer);
  activeBaseLayer = nextLayer.addTo(map);
  activeBaseLayerKey = layerName;

  bringCadastralZoningToFront();
  if (selectedMunicipalityLayer) selectedMunicipalityLayer.bringToFront();
  if (measureLayer) measureLayer.bringToFront();
  if (!options.keepQuickPanelOpen) closeLayerPanels();
  if (options.statusMessage) setStatus(options.statusMessage, false);
  syncLayerUi();
}

function setMeasureActive(active) {
  if (uiState.measureActive === active) {
    syncLayerUi();
    return;
  }

  uiState.measureActive = active;
  if (active) {
    closeLayerPanels();
    ensureMeasureLayer();
    lastMeasureClick = null;
    map.doubleClickZoom.disable();
    setStatus("Misura attiva: tocca i punti sulla mappa, doppio click per terminare");
  } else if (measurePoints.length > 0) {
    map.doubleClickZoom.enable();
    setStatus(`Misura terminata: ${formatDistance(measureTotalMeters)}`);
  } else {
    map.doubleClickZoom.enable();
  }
  syncLayerUi();
}

function ensureMeasureLayer() {
  if (!measureLayer) measureLayer = L.layerGroup().addTo(map);
  if (!map.hasLayer(measureLayer)) measureLayer.addTo(map);
}

function addMeasurePoint(latlng) {
  const now = Date.now();
  if (
    lastMeasureClick &&
    now - lastMeasureClick.time < 450 &&
    lastMeasureClick.latlng.distanceTo(latlng) < 3
  ) {
    return;
  }
  lastMeasureClick = { latlng, time: now };

  ensureMeasureLayer();

  measurePoints.push(latlng);
  L.circleMarker(latlng, {
    radius: 5,
    color: "#fff",
    weight: 2,
    fillColor: "#2563eb",
    fillOpacity: 1,
    interactive: false,
  }).addTo(measureLayer);

  if (measurePoints.length > 1) {
    measureTotalMeters += measurePoints[measurePoints.length - 2].distanceTo(latlng);
  }

  if (!measureLine) {
    measureLine = L.polyline(measurePoints, {
      color: "#2563eb",
      weight: 4,
      opacity: 0.95,
      interactive: false,
    }).addTo(measureLayer);
  } else {
    measureLine.setLatLngs(measurePoints);
  }

  setStatus(
    measurePoints.length < 2
      ? "Primo punto misura inserito"
      : `Distanza misurata: ${formatDistance(measureTotalMeters)}`
  );
  syncLayerUi();
}

function clearMeasure() {
  measurePoints = [];
  measureTotalMeters = 0;
  measureLine = null;
  lastMeasureClick = null;
  if (measureLayer) measureLayer.clearLayers();
  if (uiState.measureActive) {
    setStatus("Misura cancellata: tocca un punto sulla mappa");
  } else {
    setStatus("Misura cancellata");
  }
  syncLayerUi();
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 2 : 1)} km`;
}

function buildOutsideMask(geometry) {
  const world = [
    [90, -180],
    [90, 180],
    [-90, 180],
    [-90, -180],
  ];

  const rings = geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
  const holes = rings.map((ring) => ring.map(([lng, lat]) => [lat, lng]).reverse());
  return [world, ...holes];
}

function isPointInGeometry(point, geometry) {
  if (geometry.type === "Polygon") return isPointInPolygon(point, geometry.coordinates);
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => isPointInPolygon(point, polygon));
  }
  return null;
}

function distanceToGeometryBoundaryMeters(point, geometry) {
  const rings =
    geometry.type === "Polygon"
      ? geometry.coordinates
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates.flat()
        : [];

  if (rings.length === 0) return Infinity;
  return Math.min(...rings.map((ring) => distanceToRingMeters(point, ring)));
}

function distanceToRingMeters(point, ring) {
  if (ring.length < 2) return Infinity;

  let minDistance = Infinity;
  for (let index = 0; index < ring.length; index++) {
    const start = ring[index];
    const end = ring[(index + 1) % ring.length];
    minDistance = Math.min(minDistance, distanceToSegmentMeters(point, start, end));
  }
  return minDistance;
}

function distanceToSegmentMeters(point, start, end) {
  const [px, py] = projectAroundPoint(point, point);
  const [x1, y1] = projectAroundPoint(start, point);
  const [x2, y2] = projectAroundPoint(end, point);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const segmentLengthSquared = dx * dx + dy * dy;

  if (segmentLengthSquared === 0) return Math.hypot(px - x1, py - y1);

  const rawT = ((px - x1) * dx + (py - y1) * dy) / segmentLengthSquared;
  const t = Math.max(0, Math.min(1, rawT));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function projectAroundPoint(coordinate, origin) {
  const [lng, lat] = coordinate;
  const [originLng, originLat] = origin;
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = metersPerDegreeLat * Math.cos((originLat * Math.PI) / 180);
  return [(lng - originLng) * metersPerDegreeLng, (lat - originLat) * metersPerDegreeLat];
}

function isPointInPolygon(point, polygon) {
  const [outerRing, ...holes] = polygon;
  if (!isPointInRing(point, outerRing)) return false;
  return !holes.some((ring) => isPointInRing(point, ring));
}

function isPointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}
