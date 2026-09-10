// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// Override buildCommand so package.json "build" can be the OpenNext worker
// build (used by Cloudflare Workers Builds) without recursing into itself.
const config = {
	...defineCloudflareConfig({
		incrementalCache: r2IncrementalCache,
	}),
	buildCommand: "pnpm exec next build",
};

export default config;
