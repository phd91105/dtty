import { plainToInstance } from "class-transformer";
import { RouteHandler } from "itty-router/Router";
import { BODY_TYPE, ControllerMethod } from "../constants";
import { DttyRequest } from "../types";

export const transformerMiddlewareFactory =
  (endpointHandler: (...args: unknown[]) => unknown): RouteHandler =>
  async (req: DttyRequest) => {
    if (
      req.method.toLowerCase() === ControllerMethod.get ||
      req.method.toLowerCase() === ControllerMethod.delete
    )
      return;

    const Constructor =
      Reflect.getMetadata(BODY_TYPE, endpointHandler) || Object;
    req._internalTransformedBody = plainToInstance(Constructor, req.rawBody);
  };
