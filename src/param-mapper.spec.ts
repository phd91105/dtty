import { ControllerParams } from "./constants";
import { ParamMapper } from "./param-mapper";
import { ControllerParamMeta, IttyRequest } from "./types";

describe("ParamMapper", () => {
  let body: Record<string, unknown>;
  let request: IttyRequest;
  let mapper: ParamMapper;

  beforeEach(() => {
    body = {
      hello: "world",
    };
    request = {
      params: {
        id: "abc",
      },
    } as unknown as IttyRequest;
    mapper = new ParamMapper(request);
  });

  it.skip("will the BODY param out", () => {
    const meta: ControllerParamMeta = {
      type: ControllerParams.BODY,
    };
    const mapped = mapper.mapTo([meta]);
    expect(mapped).toHaveLength(1);
    expect(mapped).toMatchObject(body);
  });

  describe("PARAM", () => {
    it("will map a named PARAM out as a string", () => {
      const meta: ControllerParamMeta = {
        type: ControllerParams.PARAM,
        paramName: "id",
      };

      const mapped = mapper.mapTo([meta]);
      expect(mapped).toHaveLength(1);
      expect(mapped[0]).toEqual(request.params.id);
    });
  });

  it("will map the REQUEST out", () => {
    const meta: ControllerParamMeta = {
      type: ControllerParams.REQUEST,
    };

    const mapped = mapper.mapTo([meta]);
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject(request);
  });
});