import { createRouter } from "./trpc"
import uploadRouter from "./modules/upload/router"

export const appRouter = createRouter({
	upload: uploadRouter,
})

export type AppRouter = typeof appRouter
