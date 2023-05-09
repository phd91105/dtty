import { IRequest } from "itty-router";
import { constructor } from "tsyringe/dist/typings/types";
import { ControllerMethod, ControllerParams } from "./constants";
import { DttyTransformer } from "./interfaces/transformer.interface";

export interface ControllerEndpointMetadata {
  path: string;
  propertyKey: string | symbol;
  method: ControllerMethod;
}

export type DttyRequest = IRequest &
  Request & {
    _internalTransformedBody: any;
  };

export interface RouterResponse<T = any> {
  data: T;
  status: number;
}

export type ControllerParamMeta =
  | {
      type: ControllerParams.BODY;
      bodyType?: constructor<unknown>;
    }
  | {
      type: ControllerParams.PARAM;
      paramName?: string;
      transformer?: constructor<DttyTransformer<unknown>>;
    }
  | {
      type: ControllerParams.REQUEST;
    };
