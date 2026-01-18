import { FastifyInstance } from "fastify";
import {
  pairDeviceController,
  deviceAuthController,
  locationController,
  unpairDeviceController,
} from "./device.controller.js";
import { authenticateUser } from "../../middleware/auth.middleware.js";
import { pairDeviceSchema } from "./device.shcema.js";

export default async function deviceRoutes(app: FastifyInstance) {
  app.post("/pair-device", { preHandler: authenticateUser , schema: pairDeviceSchema}, pairDeviceController);

  app.route<{ Params: { deviceId: string } }>({
    method: "DELETE",
    url: "/unpair/:deviceId",
    preHandler: authenticateUser,
    handler: unpairDeviceController,
  });

  app.post("/auth", deviceAuthController);
  app.post("/location", locationController);
}
