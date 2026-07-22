export type PlatformErrorCode =
  | 'setup_not_needed'
  | 'invalid_email'
  | 'invalid_name'
  | 'password_too_short'
  | 'password_weak'
  | 'email_send_failed'
  | 'smtp_required'
  | 'invalid_setup'
  | 'invalid_code'
  | 'user_exists'
  | 'invalid_reset'
  | 'invalid_current_password'
  | 'user_not_found';

const PLATFORM_ERROR_STATUSES: Record<PlatformErrorCode, number> = {
  setup_not_needed: 409,
  invalid_email: 400,
  invalid_name: 400,
  password_too_short: 400,
  password_weak: 400,
  email_send_failed: 502,
  smtp_required: 503,
  invalid_setup: 404,
  invalid_code: 401,
  user_exists: 409,
  invalid_reset: 404,
  invalid_current_password: 401,
  user_not_found: 404,
};

export class PlatformError<TCode extends PlatformErrorCode = PlatformErrorCode> extends Error {
  readonly statusCode: number;

  constructor(
    readonly code: TCode,
    message: string,
  ) {
    super(message);
    this.name = 'PlatformError';
    this.statusCode = PLATFORM_ERROR_STATUSES[code] ?? 400;
  }
}
