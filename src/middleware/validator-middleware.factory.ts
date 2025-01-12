import { validate } from "class-validator";
import { RouteHandler } from "itty-router/Router";
import { ControllerMethod } from "../constants";
import { ValidationException } from "../exceptions/validation.exception";
import { DttyRequest } from "../types";

export const validatorMiddlewareFactory =
  (): RouteHandler => async (req: DttyRequest) => {
    if (
      req.method.toLowerCase() === ControllerMethod.get ||
      req.method.toLowerCase() === ControllerMethod.delete
    )
      return;
    if (req._internalTransformedBody.constructor.name === Object.name) return;

    const errors = await validate(req._internalTransformedBody);
    if (errors.length > 0) throw new ValidationException(errors);
  };
