declare module "pdf-parse/lib/pdf-parse.js" {
  import type { Result } from "pdf-parse";

  export default function pdf(dataBuffer: Buffer, options?: unknown): Promise<Result>;
}
