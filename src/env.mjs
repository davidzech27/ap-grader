import { z } from "zod"
import { createEnv } from "@t3-oss/env-nextjs"

export const env = createEnv({
	server: {
		NODE_ENV: z.enum(["development", "test", "production"]),
		OPENAI_SECRET_KEY: z.string(),
		GOOGLE_CLIENT_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
		JWT_SECRET: z.string(),
		URL: z.string().url(),
	},
	client: {
		NEXT_PUBLIC_CONTACT_EMAIL: z.string().email(),
	},
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		OPENAI_SECRET_KEY: process.env.OPENAI_SECRET_KEY,
		NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		JWT_SECRET: process.env.JWT_SECRET,
		URL: process.env.URL,
	},
})
