export const upsertTrackerRuleSchema = {
  body: {
    type: 'object',
    required: ['home', 'destinations', 'timerSeconds'],
    additionalProperties: false,
    properties: {
      home: {
        type: 'object',
        required: ['lat', 'lng', 'radius'],
        additionalProperties: false,
        properties: {
          lat: { type: 'number', minimum: -90, maximum: 90 },
          lng: { type: 'number', minimum: -180, maximum: 180 },
          radius: { type: 'number', minimum: 10 }, // meters
        },
      },

      destinations: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['lat', 'lng', 'radius'],
          additionalProperties: false,
          properties: {
            lat: { type: 'number', minimum: -90, maximum: 90 },
            lng: { type: 'number', minimum: -180, maximum: 180 },
            radius: { type: 'number', minimum: 10 },
          },
        },
      },

      timerSeconds: {
        type: 'number',
        minimum: 30,      // 30 seconds minimum
        maximum: 86400,   // 24 hours max
      },

      isActive: {
        type: 'boolean',
        default: true,
      },
    },
  },
}
