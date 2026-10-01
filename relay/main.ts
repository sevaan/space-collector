// Space Collector plane relay as a standalone Deno server (Deno Deploy, or locally: deno run -N relay/main.ts).
import handler from './handler.ts';

Deno.serve(handler);
