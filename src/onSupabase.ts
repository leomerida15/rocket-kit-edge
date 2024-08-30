import { createClient } from "@supabase/supabase-js";
import { EdgeError } from "./onEdge/EdgeError.js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

export interface onSupabaseParams {
	req: Request;
	options: Parameters<typeof createClient>[2];
}

export const onSupabase = <D>({ req, options }: onSupabaseParams) => {
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

	return supabase;
};
