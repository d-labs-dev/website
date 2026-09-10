/**
 * Google Maps.
 *
 * Port of `initMap()` from the old scripts.js. The options are the original's
 * verbatim — zoom 6, the same computed centre, the same greyscale style with
 * D-LABS blue water, and the same 25x25 marker at the same three coordinates.
 *
 * Two differences remain: the API key comes from a public env var rather than
 * being hardcoded in the template, and the script is appended by this module
 * instead of sitting inline in the markup. Both are invisible to the visitor.
 */

const OFFICES = [
  { name: "Potsdam", lat: 52.3902283, lng: 13.1171623 },
  { name: "Stuttgart", lat: 48.7765607, lng: 9.1767708 },
  { name: "Berlin", lat: 52.5051579, lng: 13.4642886 },
] as const;

/** Centre of the bounding box across the three offices, as in the original. */
const CENTRE = {
  lat: 48.77 + (52.5 - 48.77) / 2,
  lng: 9.17 + (13.12 - 9.17) / 2,
};

/**
 * Greyscale basemap with D-LABS blue water. Carried over verbatim; the road
 * entries the original had commented out are simply left out.
 */
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#9e9e9e" }],
  },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#007ABD" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

const MARKER_ICON = "/map-marker.svg";

declare global {
  interface Window {
    google?: any;
    __dlabsInitMap?: () => void;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadMapsScript(apiKey: string): Promise<void> {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    window.__dlabsInitMap = () => resolve();

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&callback=__dlabsInitMap&loading=async`;
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function render(container: HTMLElement) {
  const google = window.google;
  if (!google?.maps) return;

  const map = new google.maps.Map(container, {
    zoom: 6,
    center: CENTRE,
    styles: MAP_STYLES,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  });

  for (const office of OFFICES) {
    new google.maps.Marker({
      position: { lat: office.lat, lng: office.lng },
      map,
      title: office.name,
      icon: { url: MARKER_ICON, scaledSize: new google.maps.Size(25, 25) },
    });
  }
}

export function setupMap(): void {
  const container = document.querySelector<HTMLElement>("[data-map]");
  if (!container) return;

  const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    // No key, no map — and no half-rendered grey box either. The container keeps
    // its height so the page does not reflow.
    console.warn("PUBLIC_GOOGLE_MAPS_API_KEY is not set; the map will not render.");
    return;
  }

  void loadMapsScript(apiKey)
    .then(() => render(container))
    .catch(() => {
      /* Google unreachable: leave the empty container rather than an error box. */
    });
}
