export class AppError extends Error {
  constructor(
    public readonly code:
      | "VALIDATION_ERROR"
      | "ROUTE_NOT_FOUND"
      | "ROUTING_PROVIDER_ERROR"
      | "RATE_LIMITED"
      | "INTERNAL_SERVER_ERROR",
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}
