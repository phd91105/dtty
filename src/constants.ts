export const APPLY_HANDLER_META = "ah";
export const APPLY_MIDDLEWARE_META = "m";
export const CONTROLLER_ENDPOINTS_META = "cem";
export const GATEWAY_ENDPOINTS_META = "gwem";
export const CONTROLLER_META = "cm";
export const GATEWAY_META = "gwm";
export const CONTROLLER_PARAM_META = "cp";
export const BODY_TYPE = "bt";
export const EXCEPTION_HANDLER_META = "ex";

export enum ControllerMethod {
  delete = "delete",
  get = "get",
  post = "post",
  patch = "patch",
  put = "put",
}

export enum WebSocketGatewayMethod {
  subscribeMessage = "sm",
}

export enum ControllerParams {
  BODY = "b",
  PARAM = "p",
  QUERY = "q",
  REQUEST = "r",
}

export enum Scope {
  /**
   * Only maintain one instance of a given
   * dependency in the application
   */
  Singleton,
  /**
   * Create a new instance of the dependency
   * each time it is requested
   */
  Transient,
}
