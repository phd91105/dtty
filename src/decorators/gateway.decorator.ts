import { singleton } from "tsyringe";
import { constructor } from "tsyringe/dist/typings/types";
import { GATEWAY_META } from "../constants";

/**
 * Mark a class as the webSocket gateway for a given path
 */
export const WebSocketGateway =
  (path?: string) => (target: constructor<unknown>) => {
    Reflect.defineMetadata(GATEWAY_META, path, target);
    singleton()(target);
  };
