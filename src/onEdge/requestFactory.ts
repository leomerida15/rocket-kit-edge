// deno-lint-ignore-file no-explicit-any
import { TypeOf, ZodObject, ZodType, ZodTypeDef } from "zod";
import { IZodRequestFactoryResp, IZodSchemasValid } from "./types";
import ValidAndFormat from "./validAndFormat";

/**
 * The main function of the request factory.
 * It takes a native request and returns a modified request
 * with the body, query and info properties.
 *
 * @typeParam B - The type of the body.
 * @typeParam C - The type of the info.
 * @typeParam Q - The type of the query.
 * @param nativeRequest - The native request.
 * @param info - The info object.
 * @param Schemas - The schemas object.
 * @returns The modified request.
 */
export const requestFactory = async <
    B extends ZodType<any, ZodTypeDef, any>,
    C extends ZodObject<any>,
    Q extends ZodObject<any>,
>(
    nativeRequest: Request,
    info: TypeOf<C>,
    Schemas?: IZodSchemasValid<B, C, Q>,
) => {
    // Create an instance of ValidAndFormat.
    const validAndFormat = new ValidAndFormat<B, C, Q>(
        nativeRequest,
        info,
        Schemas,
    );

    // Get the Info object.
    const Info = validAndFormat.Info();

    // Get the Query function.
    const Query = validAndFormat.query();

    // Get the body.
    const body = await validAndFormat.body();

    // Add the getInfo, getQuery and getBody methods to the request.
    (nativeRequest as unknown as IZodRequestFactoryResp<B, C, Q>).getInfo =
        () => Info;
    (nativeRequest as unknown as IZodRequestFactoryResp<B, C, Q>).getQuery = (
        keys: Array<keyof TypeOf<Q> | string>,
    ) => Query(keys);
    (nativeRequest as unknown as IZodRequestFactoryResp<B, C, Q>).getBody =
        () => body;

    // Return the modified request.
    return nativeRequest as unknown as IZodRequestFactoryResp<B, C, Q>;
};
