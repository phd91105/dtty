export const APPLY_MIDDLEWARE_META = "m";
export const CONTROLLER_ENDPOINTS_META = "cem";
export const CONTROLLER_META = "cm";
export const CONTROLLER_PARAM_META = "cp";
export const BODY_TYPE = "bt";

export enum ControllerMethod {
  delete = "delete",
  get = "get",
  post = "post",
  put = "put",
}

export enum ControllerParams {
  BODY = "b",
  PARAM = "p",
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
