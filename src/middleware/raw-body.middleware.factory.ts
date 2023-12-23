import { RouteHandler } from "itty-router/Router";
import { ControllerMethod } from "../constants";
import { DttyRequest } from "../types";

export const rawBodyMiddlewareFactory =
  (): RouteHandler => async (req: DttyRequest) => {
    if (
      req.method.toLowerCase() === ControllerMethod.get ||
      req.method.toLowerCase() === ControllerMethod.delete
    )
      return;

    req.rawBody = await req.json();
  };
