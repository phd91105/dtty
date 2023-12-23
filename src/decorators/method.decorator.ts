import {
  CONTROLLER_ENDPOINTS_META,
  ControllerMethod,
  GATEWAY_ENDPOINTS_META,
  WebSocketGatewayMethod,
} from "../constants";
import {
  ControllerEndpointMetadata,
  WebSocketGatewayEndpointMetadata,
} from "../types";

const methodDecorator =
  ({
    method,
    path,
  }: Omit<ControllerEndpointMetadata, "propertyKey">): MethodDecorator =>
  (target, propertyKey) => {
    if (Reflect.hasMetadata(CONTROLLER_ENDPOINTS_META, target.constructor)) {
      const existing: ControllerEndpointMetadata[] = Reflect.getMetadata(
        CONTROLLER_ENDPOINTS_META,
        target.constructor,
      );
      Reflect.defineMetadata(
        CONTROLLER_ENDPOINTS_META,
        existing.concat({ method, path, propertyKey }),
        target.constructor,
      );
    } else {
      Reflect.defineMetadata(
        CONTROLLER_ENDPOINTS_META,
        [{ method, path, propertyKey }],
        target.constructor,
      );
    }
  };

const gatewayMessageDecorator =
  ({
    method,
    message,
  }: Omit<WebSocketGatewayEndpointMetadata, "propertyKey">): MethodDecorator =>
  (target, propertyKey) => {
    if (Reflect.hasMetadata(GATEWAY_ENDPOINTS_META, target.constructor)) {
      const existing: WebSocketGatewayEndpointMetadata[] = Reflect.getMetadata(
        CONTROLLER_ENDPOINTS_META,
        target.constructor,
      );
      Reflect.defineMetadata(
        GATEWAY_ENDPOINTS_META,
        existing.concat({ method, message, propertyKey }),
        target.constructor,
      );
    } else {
      Reflect.defineMetadata(
        GATEWAY_ENDPOINTS_META,
        [{ method, message, propertyKey }],
        target.constructor,
      );
    }
  };

export const Delete = (path = "/"): MethodDecorator =>
  methodDecorator({ path, method: ControllerMethod.delete });

export const Get = (path = "/"): MethodDecorator =>
  methodDecorator({ path, method: ControllerMethod.get });

export const Post = (path = "/"): MethodDecorator =>
  methodDecorator({ path, method: ControllerMethod.post });

export const Patch = (path = "/"): MethodDecorator =>
  methodDecorator({ path, method: ControllerMethod.patch });

export const Put = (path = "/"): MethodDecorator =>
  methodDecorator({ path, method: ControllerMethod.put });

export const SubscribeMessage = (message: string): MethodDecorator =>
  gatewayMessageDecorator({
    message,
    method: WebSocketGatewayMethod.subscribeMessage,
  });
