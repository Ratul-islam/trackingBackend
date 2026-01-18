export const pairDeviceSchema = {
  body: {
    type: 'object',
    required: ['deviceId', 'deviceSecret', 'name'],
    properties: {
      deviceId: { type: 'string', minLength: 3 },
      deviceSecret: { type: 'string', minLength: 6 },
      name: {type:'string', minLength: 3, maxLength: 20}
    },
  },
}

export const deviceAuthSchema = {
  body: {
    type: 'object',
    required: ['deviceId', 'deviceSecret'],
    properties: {
      deviceId: { type: 'string', minLength: 3 },
      deviceSecret: { type: 'string', minLength: 3 },
    },
  },
}

export const deviceLocationSchema = {
  body: {
    type: 'object',
    required: ['lat', 'lng', 'token'],
    properties: {
      lat: { type: 'number', minimum: -90, maximum: 90 },
      lng: { type: 'number', minimum: -180, maximum: 180 },
      token: {type: 'string'},
      speed: { type: 'number' },
      battery: { type: 'number' },
      timestamp: { type: 'number' },
    },
  },
}
