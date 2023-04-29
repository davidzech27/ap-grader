import { authedProcedure, createRouter } from "~/server/trpc"

const uploadRouter = createRouter({
	getLink: authedProcedure.query(async () => {}),
})

export default uploadRouter
