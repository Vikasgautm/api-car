import { ZodIssue } from 'zod';

declare module 'zod' {
  interface ZodError {
    errors: ZodIssue[];
  }
}
