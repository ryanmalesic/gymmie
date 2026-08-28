import { z } from "@/lib/zod";

export interface RpcModelOptions<
  TShape extends z.ZodRawShape,
  TPickReq extends keyof TShape,
  TPickRes extends keyof TShape = keyof TShape,
> {
  idField?: keyof TShape;
  model: z.ZodObject<TShape>;
  name: string;
  pickRequest: readonly TPickReq[];
  pickResponse?: readonly TPickRes[];
}

export function rpcSchemas<
  TShape extends z.ZodRawShape,
  TPickReq extends keyof TShape,
  TPickRes extends keyof TShape = keyof TShape,
>(options: RpcModelOptions<TShape, TPickReq, TPickRes>) {
  const { idField, model, name, pickRequest, pickResponse } = options;

  const reqShape: Record<string, z.ZodTypeAny> = {};
  if (idField && idField in model.shape) {
    reqShape[idField as string] = model.shape[
      idField as string
    ] as z.ZodTypeAny;
  }
  for (const key of pickRequest) {
    reqShape[key as string] = model.shape[key as string] as z.ZodTypeAny;
  }

  const requestSchema = z.object(reqShape).strict().openapi(`${name}Request`);

  const pickedResponse = pickResponse
    ? model.pick(
        pickResponse.reduce<Record<string, true>>(
          (acc, k) => ({ ...acc, [k as string]: true }),
          {},
        ) as never,
      )
    : model;

  const responseSchema = pickedResponse.strict().openapi(`${name}Response`);

  return {
    requestSchema: requestSchema as unknown as z.ZodObject<{
      [K in TPickReq]: TShape[K];
    }>,
    responseSchema: responseSchema as unknown as z.ZodObject<{
      [K in TPickRes]: TShape[K];
    }>,
  };
}
