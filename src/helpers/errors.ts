import { AxiosError } from "axios";

export /** @desc Ehh! Got Rate Limites by RITO */
const isRateLimitError = (err: unknown) =>
  err instanceof AxiosError && err.response?.status === 429;
