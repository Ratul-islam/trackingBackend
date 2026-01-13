export type TrackerRuntimeState = {
  isInsideHome: boolean

  alertActive: boolean

  exitedHomeAt?: number

  alertTimer?: NodeJS.Timeout

  timerStartedAt?: number

  lastLocation?: { lat: number; lng: number }

  currentAlertId?: string
  
  alertSentAt?: number
}

export const trackerRuntime = new Map<string, TrackerRuntimeState>()
