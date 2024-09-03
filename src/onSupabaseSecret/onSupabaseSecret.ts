import { Deno } from "@deno/types";
import { createClient } from "@supabase/supabase-js";
import { EdgeError, IZodRequestFactoryResp } from "../index";

const url = Deno.env.get("SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

export const onSupabaseSecret = <Database>({
	req,
	options,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	req: Request | IZodRequestFactoryResp<any, any, any, any>;
	options?: Parameters<typeof createClient<Database>>[2];
}) => {
	const Authorization = req.headers.get("Authorization") as string;

	if (!url || !key) throw new EdgeError();

	const supabase = createClient<Database>(url, key, {
		...options,

		global: {
			...options?.global,
			headers: {
				Authorization,
				...options?.global?.headers,
			},
		},
	});

	return supabase;
};
