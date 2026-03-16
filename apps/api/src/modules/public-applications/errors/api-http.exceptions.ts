import { ConflictException, ForbiddenException, NotFoundException, UnauthorizedException, UnprocessableEntityException } from "@nestjs/common";

type ErrorDetail = {
  path: string;
  issue: string;
};

function buildErrorBody(code: string, message: string, details: ErrorDetail[] = []) {
  return {
    error: {
      code,
      message,
      details
    }
  };
}

export class ApiValidationException extends UnprocessableEntityException {
  constructor(details: ErrorDetail[]) {
    super(buildErrorBody("VALIDATION_FAILED", "Page data validation failed", details));
  }
}

export class ApiResourceNotFoundException extends NotFoundException {
  constructor(message: string) {
    super(buildErrorBody("NOT_FOUND", message));
  }
}

export class ApiTenantIsolationException extends ForbiddenException {
  constructor(message = "Cross-tenant application access denied") {
    super(buildErrorBody("FORBIDDEN", message));
  }
}

export class ApiUnauthorizedException extends UnauthorizedException {
  constructor(message = "Authentication required") {
    super(buildErrorBody("UNAUTHORIZED", message));
  }
}

export class ApiConflictException extends ConflictException {
  constructor(message: string) {
    super(buildErrorBody("CONFLICT", message));
  }
}
