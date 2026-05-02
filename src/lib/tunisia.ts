// Shared Tunisia map config to clamp Leaflet to country bounds.
import type { LatLngBoundsLiteral, LatLngTuple } from "leaflet";

export const TUNISIA_BOUNDS: LatLngBoundsLiteral = [
  [30.2, 7.5],
  [37.5, 11.6],
];
export const TUNISIA_MAX_BOUNDS: LatLngBoundsLiteral = [
  [29.0, 7.0],
  [38.5, 12.5],
];
export const TUNISIA_CENTER: LatLngTuple = [33.8, 9.5];

export const TUNISIA_MAP_PROPS = {
  center: TUNISIA_CENTER,
  zoom: 6,
  minZoom: 6,
  maxZoom: 10,
  maxBounds: TUNISIA_MAX_BOUNDS,
  maxBoundsViscosity: 1.0,
  worldCopyJump: false,
} as const;

export const TUNISIA_TILE_PROPS = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "&copy; OpenStreetMap",
  noWrap: true,
  bounds: TUNISIA_BOUNDS,
} as const;
