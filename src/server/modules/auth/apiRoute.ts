import { type NextApiHandler } from "next"
import { createUnauthedOAuth2Client, redirectUrl } from "~/server/modules/auth/google"
import { google } from "googleapis"
import { setAuth } from "~/server/modules/auth/jwt"

const authHandler: NextApiHandler = async (req, res) => {
	const urlEnding = req.url?.split("/")[2]?.split("?")[0]

	if (
		urlEnding === undefined ||
		(urlEnding !== "authenticate" && urlEnding !== redirectUrl.split("/").at(-1))
	)
		return res.status(400).end()

	const oauth2Client = createUnauthedOAuth2Client()

	if (urlEnding === "authenticate") {
		if (req.method !== "POST") return res.status(405).end()

		const authUrl = oauth2Client.generateAuthUrl({
			access_type: "offline",
			scope: [
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
			],
			prompt: "consent",
			include_granted_scopes: true,
		})

		return res.send(authUrl)
	} else {
		if (req.method !== "GET") return res.status(405).end()

		const { code } = req.query

		if (typeof code !== "string") return res.status(400).end()

		const { tokens } = await oauth2Client.getToken(code)

		oauth2Client.setCredentials(tokens)

		const people = google.people({ version: "v1", auth: oauth2Client })

		const {
			data: { emailAddresses, photos },
		} = await people.people.get({
			resourceName: "people/me",
			personFields: "emailAddresses,photos",
		})

		const email = emailAddresses?.[0]?.value

		if (!email) return res.status(500).end()

		await setAuth({
			req,
			res,
			auth: {
				email,
				photo: photos?.[0]?.url ?? undefined,
			},
		})

		return res.redirect("/home")
	}
}

export default authHandler
