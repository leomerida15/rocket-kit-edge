import { getReasonPhrase, StatusCodes } from "http-status-codes";

interface EdgeErrorParams {
    status?: number;
    message?: string;
}

export class EdgeError extends Error {
    statusText?: string;
    status: number;

    constructor(
        {
            status = StatusCodes.INTERNAL_SERVER_ERROR,
            message = getReasonPhrase(status),
        }: EdgeErrorParams = {},
    ) {
        super(message);
        this.name = "EdgeError";

        this.status = status;
        this.statusText = getReasonPhrase(status);
    }

    get resp(): [string, { status: number; statusText?: string }] {
        return [super.message, {
            status: this.status,
            statusText: this.statusText,
        }];
    }
}
