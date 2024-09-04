import { createClient } from "@supabase/supabase-js";
import { EdgeError, IZodRequestFactoryResp, StatusCodes } from "../index";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const onSupabaseSecret = <Database>({
	req,
	options,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	req: Request | IZodRequestFactoryResp<any, any, any, any>;
	options?: Parameters<typeof createClient<Database>>[2];
}) => {
	if (!url || !key) {
		const message =
			"the .env var SUPABASE_URL as SUPABASE_SERVICE_ROLE_KEY is required";

		throw new EdgeError({ message, status: StatusCodes.BAD_REQUEST });
	}

	const Authorization = `Bearer ${key}`;

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
