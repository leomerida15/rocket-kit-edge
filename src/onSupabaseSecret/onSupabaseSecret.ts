import { Deno } from "@deno/types";
import { createClient } from "@supabase/supabase-js";
import { EdgeError, IZodRequestFactoryResp } from "../index";

const url = Deno.env.get("SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface onSupabaseParams<D> {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	req: Request | IZodRequestFactoryResp<any, any, any, any>;
	options?: Parameters<typeof createClient<D>>[2];
}

export const onSupabaseSecret = <D>({ req, options }: onSupabaseParams<D>) => {
	const Authorization = req.headers.get("Authorization") as string;

	if (!url || !key) throw new EdgeError();

	const supabase = createClient<D>(url, key, {
		...options,

		global: {
			...options?.global,
			headers: {
				Authorization,
				...options?.global?.headers,
			},
		},
	});

	const resp = supabase.from("users").select();

	type data = Awaited<typeof resp>["data"];

	return supabase;
};
