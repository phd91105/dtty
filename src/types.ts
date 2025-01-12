import type { IRequest } from "itty-router/Router";
import { constructor } from "tsyringe/dist/typings/types";
import {
  ControllerMethod,
  ControllerParams,
  WebSocketGatewayMethod,
} from "./constants";
import { DttyTransformer } from "./interfaces/transformer.interface";

export interface ControllerEndpointMetadata {
  path: string;
  propertyKey: string | symbol;
  method: ControllerMethod;
}

export interface WebSocketGatewayEndpointMetadata {
  message: string;
  propertyKey: string | symbol;
  method: WebSocketGatewayMethod;
}

export type DttyRequest = IRequest &
  Request & {
    rawBody: any;
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
      type: ControllerParams.QUERY;
      paramName: string;
      transformer?: constructor<DttyTransformer<unknown>>;
    }
  | {
      type: ControllerParams.QUERY;
      paramsType?: constructor<unknown>;
    }
  | {
      type: ControllerParams.REQUEST;
    };
