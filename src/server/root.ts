import { createRouter } from "./trpc"
import frqRouter from "./modules/frq/router"

export const appRouter = createRouter({
	frq: frqRouter,
})

export type AppRouter = typeof appRouter
