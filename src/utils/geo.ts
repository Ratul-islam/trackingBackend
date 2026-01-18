export function isInsideGeofence(
  point: { lat: number; lng: number },
  center: { lat: number; lng: number; radius?: number; radiusMeters?: number }
) {
  const R = 6371000

  const radius =
    typeof center.radiusMeters === 'number'
      ? center.radiusMeters
      : typeof center.radius === 'number'
      ? center.radius
      : NaN

  if (!Number.isFinite(radius)) return false

  const dLat = ((center.lat - point.lat) * Math.PI) / 180
  const dLng = ((center.lng - point.lng) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((point.lat * Math.PI) / 180) *
      Math.cos((center.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c <= radius
}
