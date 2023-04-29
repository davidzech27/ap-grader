import { createNextApiHandler } from "@trpc/server/adapters/next"
import { env } from "~/env.mjs"
import { createContext } from "~/server/trpc"
import { appRouter } from "~/server/root"

export default createNextApiHandler({
	router: appRouter,
	createContext,
	onError:
		env.NODE_ENV === "development"
			? ({ path, error }) => {
					console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`)
			  }
			: undefined,
})
