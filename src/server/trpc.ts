import { type CreateNextContextOptions } from "@trpc/server/adapters/next"
import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import { ZodError } from "zod"
import { getAuth } from "./modules/auth/jwt"

export const createContext = async ({ req, res }: CreateNextContextOptions) => ({
	req,
	res,
})

const t = initTRPC.context<typeof createContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		}
	},
})

export const createRouter = t.router

export const publicProcedure = t.procedure

const isAuthed = t.middleware(async ({ ctx: { req, res }, next }) => {
	const auth = await getAuth({ req, res })

	if (!auth) throw new TRPCError({ code: "UNAUTHORIZED" })

	const { email } = auth

	return next({
		ctx: {
			email,
			req,
			res,
		},
	})
})

export const authedProcedure = t.procedure.use(isAuthed)
