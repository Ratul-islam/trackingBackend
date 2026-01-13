import { WebSocket } from 'ws'

const userSockets = new Map<string, Set<WebSocket>>()

export function addUserSocket(userId: string, socket: WebSocket) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set())
  }
  userSockets.get(userId)!.add(socket)
}

export function removeUserSocket(userId: string, socket: WebSocket) {
  userSockets.get(userId)?.delete(socket)
}

export function pushAlertToUser(userId: string, payload: any) {
  const sockets = userSockets.get(userId)
  if (!sockets) return

  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(payload))
    }
  }
}
