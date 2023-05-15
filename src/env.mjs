import { z } from "zod"
import { createEnv } from "@t3-oss/env-nextjs"

export const env = createEnv({
	server: {
		NODE_ENV: z.enum(["development", "test", "production"]),
		OPENAI_SECRET_KEY: z.string(),
		GOOGLE_CLIENT_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
		GOOGLE_CREDENTIALS: z.string().transform((str) =>
			z
				.object({
					type: z.literal("service_account"),
					project_id: z.literal("ap-grader"),
					private_key_id: z.string(),
					private_key: z.string(),
					client_id: z.string(),
					client_email: z.string().email(),
					auth_uri: z.string().url(),
					token_uri: z.string().url(),
					auth_provider_x509_cert_url: z.string().url(),
					client_x509_cert_url: z.string().url(),
				})
				.parse(JSON.parse(str))
		),
		EDGE_CONFIG: z.string().url(),
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
		GOOGLE_CREDENTIALS: process.env.GOOGLE_CREDENTIALS,
		EDGE_CONFIG: process.env.EDGE_CONFIG,
		JWT_SECRET: process.env.JWT_SECRET,
		URL: process.env.URL,
	},
})
