import { EdgeError, IZodRequestFactoryResp } from "@/onEdge";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

export interface onSupabaseParams<D> {
	req: Request | IZodRequestFactoryResp<any, any, any, any>;
	options?: Parameters<typeof createClient<D>>[2];
}

export const onSupabase = <D>({ req, options }: onSupabaseParams<D>) => {
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
