import { createClient } from "@supabase/supabase-js";
import { RocketEnvs } from "../global.env";
import { EdgeError } from "../index";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

export const onSupabase = <
	Database,
>(
	options?: Parameters<typeof createClient<Database>>[2],
) => {
	const jwt = RocketEnvs.get("SUPABASE_JWT");

	if (!url || !key || !jwt) throw new EdgeError();

	const supabase = createClient<Database>(url, key, {
		...options,

		global: {
			...options?.global,
			headers: {
				Authorization: jwt,
				...options?.global?.headers,
			},
		},
	});

	return supabase;
};
