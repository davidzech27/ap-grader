import { type NextPage } from "next"
import { env } from "~/env.mjs"
import authenticateWithGoogle from "~/client/modules/auth/authenticateWithGoogle"

const Index: NextPage = () => {
	const onSignIn = () => {
		authenticateWithGoogle()
	}

	return (
		<div className="flex flex-col">
			<h1 className="text-9xl font-bold tracking-tight">The AI-powered AP FRQ grader</h1>

			<button
				onClick={onSignIn}
				className="mt-8 w-fit rounded-md bg-white px-8 py-6 text-4xl font-medium text-black transition hover:opacity-80"
			>
				Sign in with Google
			</button>

			<p className="mt-8 text-lg font-medium">
				Currently only available to students of the Santa Rosa City Schools district.{" "}
				<a
					href={env.NEXT_PUBLIC_CONTACT_EMAIL}
					className="font-bold underline transition hover:opacity-80"
				>
					Contact me
				</a>{" "}
				here if you&apos;d like your district to be added.
			</p>
		</div>
	)
}

export default Index
