export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const Errors = {
  notFound: (message = 'Resource not found') => new ApiError(404, 'NOT_FOUND', message),
  badRequest: (message = 'Invalid request') => new ApiError(400, 'BAD_REQUEST', message),
  unauthorized: (message = 'Unauthorized') => new ApiError(401, 'UNAUTHORIZED', message),
  forbidden: (message = 'Forbidden') => new ApiError(403, 'FORBIDDEN', message),
  conflict: (message = 'Conflict') => new ApiError(409, 'CONFLICT', message),
};
