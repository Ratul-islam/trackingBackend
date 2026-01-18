export const upsertTrackerRuleSchema = {
  body: {
    type: 'object',
    required: ['home', 'destinations', 'timerSeconds'],
    additionalProperties: false,
    properties: {
      isActive: { type: 'boolean' },
      timerSeconds: { type: 'number', minimum: 5, maximum: 86400 },

      resetTrip: { type: 'boolean' },

      home: {
        type: 'object',
        required: ['lat', 'lng', 'radiusMeters'],
        additionalProperties: false,
        properties: {
          lat: { type: 'number', minimum: -90, maximum: 90 },
          lng: { type: 'number', minimum: -180, maximum: 180 },
          radiusMeters: { type: 'number', minimum: 10, maximum: 20000 },
        },
      },

      destinations: {
        type: 'array',
        minItems: 1,
        maxItems: 20,
        items: {
          type: 'object',
          required: ['lat', 'lng', 'radiusMeters'],
          additionalProperties: false,
          properties: {
            lat: { type: 'number', minimum: -90, maximum: 90 },
            lng: { type: 'number', minimum: -180, maximum: 180 },
            radiusMeters: { type: 'number', minimum: 10, maximum: 20000 },
          },
        },
      },
    },
  },
}
