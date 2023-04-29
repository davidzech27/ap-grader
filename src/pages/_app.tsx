import { type AppType } from "next/app"
import Head from "next/head"
import { Inter } from "next/font/google"
import { api } from "~/client/api"
import "~/client/globals.css"

const inter = Inter({
	subsets: ["latin"],
})

const App: AppType = ({ Component, pageProps }) => {
	return (
		<>
			<Head>
				<title>AP FRQ Grader</title>
				<meta name="description" content="The AI-powered AP FRQ grader" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main
				className={"fixed bottom-0 h-screen w-full bg-black text-white " + inter.className}
			>
				<Component {...pageProps} />
			</main>
		</>
	)
}

export default api.withTRPC(App)
