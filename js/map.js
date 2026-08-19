const MELEGNANO_CENTER = [45.3562426686416, 9.307885207235815];
const INITIAL_ZOOM = 14;
const DATA_URL = "data/melegnano.geojson";
const TRACESTRACK_KEY = window.VECTOR_MAP_CONFIG?.tracestrackKey || "";

const map = L.map("map", {
  zoomControl: false,
  preferCanvas: true,
  fadeAnimation: false,
}).setView(MELEGNANO_CENTER, INITIAL_ZOOM);

L.control.zoom({ position: "bottomright" }).addTo(map);
L.control.scale({ position: "bottomright", metric: true, imperial: false }).addTo(map);

const baseLayers = {
  topo: createTopoLayer(),
  satellite: L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution:
        "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    }
  ),
};

let activeBaseLayer = baseLayers.topo.addTo(map);

function createTopoLayer() {
  if (TRACESTRACK_KEY) {
    return L.tileLayer(
      `https://tile.tracestrack.com/topo/{z}/{x}/{y}.png?key=${encodeURIComponent(TRACESTRACK_KEY)}`,
      {
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://www.tracestrack.com/">Tracestrack</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );
  }

  return L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  });
}

const statusPanel = document.getElementById("statusPanel");
const locationStatus = document.getElementById("locationStatus");
const locateButton = document.getElementById("locateButton");
const followButton = document.getElementById("followButton");
const resetButton = document.getElementById("resetButton");
const baseLayerInputs = document.querySelectorAll('input[name="baseLayer"]');
const boundaryToggle = document.getElementById("boundaryLayer");
const maskToggle = document.getElementById("maskLayer");

let municipalityFeature;
let boundaryLayer;
let maskLayer;
let userMarker;
let accuracyCircle;
let watchId = null;

const userIcon = L.divIcon({
  className: "",
  html: '<div class="user-location-marker" aria-hidden="true"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

init();

async function init() {
  try {
    const geojson = window.MELEGNANO_GEOJSON || (await loadGeojson(DATA_URL));
    municipalityFeature = geojson.features[0];

    boundaryLayer = L.geoJSON(geojson, {
      style: {
        color: "#b91c1c",
        weight: 4,
        opacity: 1,
        fillColor: "#ffffff",
        fillOpacity: 0.02,
      },
    }).addTo(map);

    maskLayer = L.polygon(buildOutsideMask(municipalityFeature.geometry), {
      stroke: false,
      fillColor: "#1f2933",
      fillOpacity: 0.22,
      interactive: false,
    }).addTo(map);
    boundaryLayer.bringToFront();

    boundaryLayer.bindTooltip("Comune di Melegnano", {
      sticky: true,
      direction: "top",
    });

    map.fitBounds(boundaryLayer.getBounds(), { padding: [22, 22] });
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

resetButton.addEventListener("click", () => {
  if (boundaryLayer) {
    map.fitBounds(boundaryLayer.getBounds(), { padding: [22, 22] });
  } else {
    map.setView(MELEGNANO_CENTER, INITIAL_ZOOM);
  }
});

baseLayerInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    setBaseLayer(input.value);
  });
});

boundaryToggle.addEventListener("change", () => {
  setLayerVisibility(boundaryLayer, boundaryToggle.checked);
});

maskToggle.addEventListener("change", () => {
  setLayerVisibility(maskLayer, maskToggle.checked);
});

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

  const inside = municipalityFeature
    ? isPointInGeometry([latlng[1], latlng[0]], municipalityFeature.geometry)
    : null;

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

function setLayerVisibility(layer, visible) {
  if (!layer) return;
  if (visible) {
    layer.addTo(map);
  } else {
    map.removeLayer(layer);
  }
}

function setBaseLayer(layerName) {
  const nextLayer = baseLayers[layerName];
  if (!nextLayer || nextLayer === activeBaseLayer) return;

  map.removeLayer(activeBaseLayer);
  activeBaseLayer = nextLayer.addTo(map);
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
