import * as Sentry from "@sentry/nextjs";

export type LogLevel = "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

export interface StructuredLogPayload {
  timestamp: string;
  level: LogLevel;
  service: string;
  environment: string;
  message: string;
  context?: LogContext;
  stack?: string;
  errorName?: string;
}

/**
 * Singleton Centralized Logger Utility for 369 AKR UNIVERSE.
 *
 * Provides unified telemetry across client and server runtimes:
 * - Development: Colorized, human-readable terminal/console output with metadata.
 * - Production: Structured single-line JSON log events ready for Datadog / Axiom / CloudWatch ingestors.
 * - Sentry: Boilerplate integration using @sentry/nextjs, enabled whenever NEXT_PUBLIC_SENTRY_DSN is configured.
 */
class Logger {
  private static instance: Logger;
  private readonly serviceName = "369-akr-universe-sop";

  private constructor() {
    // Private constructor enforces singleton instantiation pattern
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  }

  private hasSentry(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
  }

  private formatError(error: unknown): { message: string; stack?: string; errorName?: string } {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        errorName: error.name,
      };
    }
    if (typeof error === "string") {
      return { message: error };
    }
    try {
      return { message: JSON.stringify(error) };
    } catch {
      return { message: String(error) };
    }
  }

  /**
   * Log an error event with contextual telemetry metadata.
   * Dispatches to Sentry (if DSN configured) and outputs structured JSON (production)
   * or pretty-printed stack traces (development).
   */
  public error(error: unknown, context?: LogContext | string): void {
    const contextObj: LogContext =
      typeof context === "string" ? { context } : context || {};
    const errInfo = this.formatError(error);
    const timestamp = new Date().toISOString();

    // 1. Sentry Production Integration (@sentry/nextjs)
    if (this.hasSentry()) {
      try {
        if (error instanceof Error) {
          Sentry.captureException(error, {
            extra: contextObj,
          });
        } else {
          Sentry.captureMessage(errInfo.message, {
            level: "error",
            extra: contextObj,
          });
        }
      } catch (sentryErr) {
        // Defensive: telemetry dispatch must never crash host process
        console.error("[Logger Sentry Dispatch Failure]", sentryErr);
      }
    }

    // 2. Telemetry Output: Structured JSON (Datadog / Axiom / CloudWatch) vs Dev Pretty-Print
    if (this.isProduction()) {
      const payload: StructuredLogPayload = {
        timestamp,
        level: "error",
        service: this.serviceName,
        environment: process.env.NODE_ENV || "production",
        message: errInfo.message,
        context: Object.keys(contextObj).length > 0 ? contextObj : undefined,
        stack: errInfo.stack,
        errorName: errInfo.errorName,
      };
      console.error(JSON.stringify(payload));
    } else {
      console.error(
        `\x1b[31m[${timestamp}] [369 TELEMETRY] [ERROR]\x1b[0m ${errInfo.message}`,
        {
          ...(Object.keys(contextObj).length > 0 ? { context: contextObj } : {}),
          ...(errInfo.stack ? { stack: errInfo.stack } : {}),
        }
      );
    }
  }

  /**
   * Log a warning event with context.
   */
  public warn(message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();

    // 1. Sentry Production Integration (@sentry/nextjs)
    if (this.hasSentry()) {
      try {
        Sentry.captureMessage(message, {
          level: "warning",
          extra: context,
        });
      } catch (sentryErr) {
        console.error("[Logger Sentry Dispatch Failure]", sentryErr);
      }
    }

    // 2. Structured Output vs Dev Pretty-Print
    if (this.isProduction()) {
      const payload: StructuredLogPayload = {
        timestamp,
        level: "warn",
        service: this.serviceName,
        environment: process.env.NODE_ENV || "production",
        message,
        context,
      };
      console.warn(JSON.stringify(payload));
    } else {
      console.warn(
        `\x1b[33m[${timestamp}] [369 TELEMETRY] [WARN]\x1b[0m ${message}`,
        context || ""
      );
    }
  }

  /**
   * Log an informational event with context or breadcrumb tracking.
   */
  public info(message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();

    // 1. Sentry Breadcrumb Registration (@sentry/nextjs)
    if (this.hasSentry()) {
      try {
        Sentry.addBreadcrumb({
          category: "telemetry",
          message,
          level: "info",
          data: context,
        });
      } catch (sentryErr) {
        console.error("[Logger Sentry Dispatch Failure]", sentryErr);
      }
    }

    // 2. Structured Output vs Dev Pretty-Print
    if (this.isProduction()) {
      const payload: StructuredLogPayload = {
        timestamp,
        level: "info",
        service: this.serviceName,
        environment: process.env.NODE_ENV || "production",
        message,
        context,
      };
      console.info(JSON.stringify(payload));
    } else {
      console.info(
        `\x1b[36m[${timestamp}] [369 TELEMETRY] [INFO]\x1b[0m ${message}`,
        context || ""
      );
    }
  }
}

export const logger = Logger.getInstance();
export default logger;
