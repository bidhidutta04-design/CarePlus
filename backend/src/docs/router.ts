import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./openapi.js";

const router = Router();

router.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

router.use(
  "/",
  swaggerUi.serve as unknown as import("express").RequestHandler[],
  swaggerUi.setup(openApiSpec, { explorer: true }) as unknown as import("express").RequestHandler,
);

export default router;
