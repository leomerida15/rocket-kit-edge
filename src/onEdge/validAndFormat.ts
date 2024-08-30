// deno-lint-ignore-file no-explicit-any
import { TypeOf, ZodObject, ZodType, ZodTypeDef } from "zod";
import { IZodSchemasValid } from "./types";

export default class ValidAndFormat<
    B extends ZodType<any, ZodTypeDef, any>,
    C extends ZodObject<any>,
    Q extends ZodObject<any>,
> {
    private readonly Schemas?: IZodSchemasValid<B, C, Q>;
    private readonly NativeInfo: TypeOf<C>;
    private readonly nativeRequest: Request;
    private readonly valid_methods: boolean;
    private bodyNative: TypeOf<B> | undefined;

    constructor(
        nativeRequest: Request,
        Info: TypeOf<C>,
        Schemas?: IZodSchemasValid<B, C, Q>,
    ) {
        this.Schemas = Schemas;
        this.NativeInfo = Info;
        this.nativeRequest = nativeRequest;
        this.valid_methods = !["DELETE", "GET"].includes(
            nativeRequest.method,
        );
    }

    private getQueryParams(): URLSearchParams {
        const url = new URL(
            this.nativeRequest.url,
            this.nativeRequest.headers.get("origin") || "about:blank",
        );
        return new URLSearchParams(url.search);
    }

    private getQueryWhoNoHasSchema(): (
        queriesArray: Array<keyof TypeOf<Q>>,
    ) => Partial<TypeOf<Q>> {
        return (queriesArray) => {
            const resQueries: any = {};
            queriesArray.map((q) => {
                resQueries[q] = this.getQueryParams().get(String(q));
            });
            return resQueries;
        };
    }

    private createGetQueryWhoHasSchema(
        queryFormat: TypeOf<Q>,
    ): (queriesArray: Array<keyof TypeOf<Q>>) => Partial<TypeOf<Q>> {
        return (queriesArray) => {
            const queryFilter = Object.entries(queryFormat).filter(([k]) =>
                queriesArray.includes(k)
            );
            const queryObj = Object.fromEntries(queryFilter) as Partial<
                TypeOf<Q>
            >;
            return queryObj;
        };
    }

    Info(): TypeOf<C> {
        return this.Schemas?.Info?.parse(this.NativeInfo) || this.NativeInfo;
    }

    query(): (queriesArray: Array<keyof TypeOf<Q>>) => Partial<TypeOf<Q>> {
        return this.Schemas?.query
            ? this.createGetQueryWhoHasSchema(
                this.Schemas.query.parse(this.getQueryParams()) as TypeOf<Q>,
            )
            : this.getQueryWhoNoHasSchema();
    }

    private async defineBody() {
        if (this.valid_methods && this.Schemas?.body) {
            this.bodyNative = await this.nativeRequest.json();
        }
    }

    async body(): Promise<TypeOf<B>> {
        await this.defineBody();
        return this.Schemas?.body?.parse(this.bodyNative) || this.bodyNative;
    }
}
