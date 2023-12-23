import { ExecutionContext } from "@cloudflare/workers-types";
import { json } from "itty-router";
import { Router, type RouterType } from "itty-router/Router";
import { websocket } from "itty-router/websocket";
import { container } from "tsyringe";
import { constructor } from "tsyringe/dist/typings/types";
import {
  APPLY_HANDLER_META,
  APPLY_MIDDLEWARE_META,
  CONTROLLER_ENDPOINTS_META,
  CONTROLLER_META,
  CONTROLLER_PARAM_META,
  GATEWAY_ENDPOINTS_META,
  GATEWAY_META,
} from "./constants";
import { HttpStatus } from "./enums/httpStatus";
import { ValidationExceptionHandler } from "./exception-handlers/validation-error.handler";
import { findBestHandler } from "./functions";
import { DttyConfig } from "./interfaces/ditty-config.interface";
import { ExceptionHandler } from "./interfaces/exception-handler.interface";
import { Logger } from "./interfaces/logger.interface";
import { DttyMiddleware } from "./interfaces/middleware.interface";
import { DefaultLogger } from "./logger";
import { rawBodyMiddlewareFactory } from "./middleware/raw-body.middleware.factory";
import { transformerMiddlewareFactory } from "./middleware/transformer-middleware.factory";
import { validatorMiddlewareFactory } from "./middleware/validator-middleware.factory";
import { ParamMapper } from "./param-mapper";
import { LOGGER_TOKEN, ROUTER_TOKEN, WORKER } from "./tokens";
import {
  ControllerEndpointMetadata,
  ControllerParamMeta,
  DttyRequest,
  WebSocketGatewayEndpointMetadata,
} from "./types";

export class Dtty {
  private logger: Logger;
  private globalExceptionHandlers: Array<constructor<ExceptionHandler>>;
  private env: Record<string, unknown>;
  private context: ExecutionContext;
  private cors: string;

  constructor(config: DttyConfig = {}) {
    const { logger = DefaultLogger } = config;
    container.register(ROUTER_TOKEN, { useValue: Router() });
    container.register(LOGGER_TOKEN, { useClass: logger });
    container.register(WORKER, {
      useValue: {
        environment: () => this.env,
        ctx: () => this.context,
        get env() {
          return this.environment();
        },
        get context() {
          return this.ctx();
        },
      },
    });
    this.logger = container.resolve(LOGGER_TOKEN);
    this.globalExceptionHandlers = [ValidationExceptionHandler];
  }

  public async handle(
    req: Request,
    env?: Record<string, unknown>,
    ctx?: ExecutionContext,
  ): Promise<Response> {
    this.env = env;
    this.context = ctx;
    const router = container.resolve<RouterType>(ROUTER_TOKEN);
    const rawResponse = await router.handle(req, env, ctx).catch((err) => {
      const matchingGlobalHandler = findBestHandler(
        err,
        this.globalExceptionHandlers,
        [],
      );
      if (matchingGlobalHandler)
        return container.resolve(matchingGlobalHandler).handle(err);
      this.logger?.error(err);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: err,
      };
    });

    let headers: { [key: string]: string };
    if (this.cors) {
      headers = { "access-control-allow-origin": this.cors };
    }

    if (!rawResponse) {
      return json(
        { code: HttpStatus.NOT_FOUND, error: "Not found." },
        { status: HttpStatus.NOT_FOUND, headers },
      );
    }

    if (rawResponse instanceof Response) {
      return rawResponse;
    }

    return json(rawResponse.data, {
      status: rawResponse.status,
      headers,
    });
  }

  public registerControllers(...controllers: constructor<any>[]): void {
    controllers.forEach((c) => {
      this.mountRoutes(c);
    });
  }

  public registerGateways(...gateways: constructor<any>[]): void {
    gateways.forEach((c) => {
      this.mountGateways(c);
    });
  }

  private mountRoutes(controllerToken: constructor<any>): void {
    const rootPath = Reflect.getMetadata(CONTROLLER_META, controllerToken);
    if (!rootPath) return;
    const endpoints: ControllerEndpointMetadata[] = Reflect.getMetadata(
      CONTROLLER_ENDPOINTS_META,
      controllerToken,
    );
    if (!endpoints || !Array.isArray(endpoints)) return;

    const router = container.resolve<RouterType>(ROUTER_TOKEN);

    const controllerMiddleware: constructor<DttyMiddleware>[] =
      Reflect.getMetadata(APPLY_MIDDLEWARE_META, controllerToken) || [];

    const controllerExceptionHandlers: constructor<ExceptionHandler>[] =
      Reflect.getMetadata(APPLY_HANDLER_META, controllerToken) || [];

    endpoints.forEach((endpoint) => {
      const fullPath = rootPath + endpoint.path.replace(/\/$/, "");

      const controller = container.resolve(controllerToken);

      const endpointHandler = controller[endpoint.propertyKey];

      const endpointMiddleware: constructor<DttyMiddleware>[] =
        Reflect.getMetadata(APPLY_MIDDLEWARE_META, endpointHandler) || [];

      const endpointExceptionHandlers: constructor<ExceptionHandler>[] =
        Reflect.getMetadata(APPLY_HANDLER_META, endpointHandler) || [];

      const endpointParamMeta: ControllerParamMeta[] =
        Reflect.getMetadata(CONTROLLER_PARAM_META, endpointHandler) || [];

      router[endpoint.method](
        fullPath,
        rawBodyMiddlewareFactory(),
        ...controllerMiddleware.map(
          (middleware) => (req: DttyRequest) =>
            container.resolve<DttyMiddleware>(middleware).apply(req),
        ),
        ...endpointMiddleware.map(
          (middleware) => (req: DttyRequest) =>
            container.resolve<DttyMiddleware>(middleware).apply(req),
        ),
        transformerMiddlewareFactory(endpointHandler),
        validatorMiddlewareFactory(),
        async (req: DttyRequest) => {
          const mapper = new ParamMapper(req, container.createChildContainer());
          let data: unknown;
          let status: number;
          try {
            data = await controller[endpoint.propertyKey](
              ...mapper.mapTo(endpointParamMeta),
            );
            status = 200;
          } catch (err) {
            const handlerToken = findBestHandler(
              err,
              endpointExceptionHandlers,
              controllerExceptionHandlers,
            );
            if (handlerToken) {
              const handler = container.resolve(handlerToken);
              return handler.handle(err);
            } else {
              throw err;
            }
          }
          return {
            data,
            status,
          };
        },
      );

      this.logger.log(
        `Mounted route: [${endpoint.method.toUpperCase()}] ${fullPath}`,
      );
    });
  }

  private mountGateways(gatewayToken: constructor<any>): void {
    const rootPath = Reflect.getMetadata(GATEWAY_META, gatewayToken);

    if (!rootPath) return;
    const endpoints: WebSocketGatewayEndpointMetadata[] = Reflect.getMetadata(
      GATEWAY_ENDPOINTS_META,
      gatewayToken,
    );
    if (!endpoints || !Array.isArray(endpoints)) return;

    const router = container.resolve<RouterType>(ROUTER_TOKEN);
    const [client, server]: any = Object.values(new WebSocketPair());
    server.accept();

    endpoints.forEach((endpoint) => {
      const gateway = container.resolve(gatewayToken);

      router.get(rootPath, (req: DttyRequest) => {
        const upgradeHeader = req.headers.get("Upgrade");
        if (upgradeHeader !== "websocket") {
          return json(
            { code: HttpStatus.BAD_GATEWAY, error: "Bad request." },
            { status: HttpStatus.BAD_GATEWAY },
          );
        }

        server.addEventListener("message", ({ data }) => {
          data = JSON.parse(data);

          if (data.message == endpoint.message) {
            Promise.resolve(gateway[endpoint.propertyKey](data.value)).then(
              (value: string) => {
                server.send(value);
              },
            );
          }
        });

        return websocket(client);
      });

      this.logger.log(`Mounted gateway: [${endpoint.message}] ${rootPath}`);
    });
  }

  /**
   * Add global middleware handlers
   * Call this method before registering controllers
   */
  public setGlobalMiddleware(...handlers: constructor<DttyMiddleware>[]) {
    container
      .resolve<RouterType>(ROUTER_TOKEN)
      .all(
        "*",
        ...handlers.map(
          (middleware) => (req: DttyRequest) =>
            container.resolve(middleware).apply(req),
        ),
      );
  }

  /**
   * Add global exception handlers
   */
  public setGlobalExceptionHandlers(
    ...handlers: constructor<ExceptionHandler>[]
  ) {
    this.globalExceptionHandlers.push(...handlers);
  }

  /**
   * Global cors handlers
   */
  public enableCors(cors = "*") {
    this.cors = cors;
  }
}
