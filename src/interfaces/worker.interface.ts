export interface Env {
  [key: string]: any;
}

export interface Worker {
  env: Env;
  context: ExecutionContext;
}
