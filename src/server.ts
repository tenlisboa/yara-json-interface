import "dotenv/config";
import "reflect-metadata";
import express, { NextFunction, Request, Response } from "express";
import "express-async-errors";
import yara from "@automattic/yara";
import { router } from "./routes";
import swaggerUI from "swagger-ui-express";

import swaggerFile from "./swagger.json";
import { AppDataSource } from "./database";

import "./shared/container";
import { AppError } from "./errors/AppError";

export const createApp = () => {
  const app = express();

  app.use(express.json());

  app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerFile));

  app.use("/api", router);

  app.use(
    (err: Error, request: Request, response: Response, next: NextFunction) => {
      if (err instanceof AppError) {
        return response.status(err.statusCode).json({
          error: true,
          message: err.message,
        });
      }

      console.error(err);
      return response.status(500).json({
        error: true,
        message: err.message,
      });
    }
  );

  return app;
};

export const initializeServer = async (dataSource = AppDataSource) => {
  await dataSource.initialize();

  try {
    await yara.initializeAsync();

    console.log("Yara listening");
  } catch (err) {
    console.error("Yara error: ", err);
  }

  return createApp();
};

if (process.env.NODE_ENV !== "testing") {
  initializeServer().then((app) => {
    app.listen(3333, () => {
      console.log("Server is running");
    });
  });
}
