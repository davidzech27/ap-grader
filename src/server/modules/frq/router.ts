import { z } from "zod"
import { Storage } from "@google-cloud/storage"
import { v1 as vision } from "@google-cloud/vision"
import { authedProcedure, createRouter } from "~/server/trpc"
import { env } from "~/env.mjs"
import { getFRQInfoFromPath, getFRQPath } from "~/cloudStorage"

const bucket = new Storage({ credentials: env.GOOGLE_CREDENTIALS }).bucket("frqs")

const frqRouter = createRouter({
	getAll: authedProcedure.query(async () => {
		const [frqFiles] = await bucket.getFiles()

		const frqQuestionsFiles = frqFiles.filter((frqFile) =>
			frqFile.cloudStorageURI.href.endsWith("questions.pdf")
		)

		const frqsInfo = frqQuestionsFiles.map((frqQuestionsFile) =>
			getFRQInfoFromPath(
				frqQuestionsFile.cloudStorageURI.href.slice(
					frqQuestionsFile.cloudStorageURI.href.indexOf("/", 5)
				)
			)
		)

		const frqs = frqsInfo.map((frqInfo) => ({
			...frqInfo,
			displayName: `${frqInfo.year}${
				frqInfo.set !== undefined ? ` - ${frqInfo.set}` : ""
			} ${frqInfo.course
				.split("-")
				.map((word) => `${word[0]?.toUpperCase()}${word.slice(1)}`)
				.join(" ")
				.replace("Ap", "AP")
				.replace("Ab", "AB")
				.replace("Bc", "BC")}`,
		}))

		return frqs
	}),
	getText: authedProcedure
		.input(z.object({ course: z.string(), year: z.number(), set: z.number().optional() }))
		.query(async ({ input: frqInfo }) => {
			const folderPath = getFRQPath({ ...frqInfo, type: "questions" }).replace(
				"questions.pdf",
				""
			)

			const questionsPdfPath = folderPath + "questions.pdf"
			const scoringPdfPath = folderPath + "scoring.pdf"
			const questionsTextPath = folderPath + "questions.txt"
			const scoringTextPath = folderPath + "scoring.txt"

			const pathToURI = (path: string) => `gs://frqs/${path}`

			let questions: string
			let scoring: string

			try {
				questions = (await bucket.file(questionsTextPath).download())[0].toString("utf8")
				scoring = (await bucket.file(scoringTextPath).download())[0].toString("utf8")
			} catch (_) {
				const client = new vision.ImageAnnotatorClient({
					credentials: env.GOOGLE_CREDENTIALS,
				})

				await Promise.all([
					client.asyncBatchAnnotateFiles({
						requests: [
							{
								inputConfig: {
									mimeType: "application/pdf",
									gcsSource: { uri: pathToURI(questionsPdfPath) },
								},
								outputConfig: {
									gcsDestination: { uri: pathToURI(questionsTextPath) },
								},
								features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
							},
						],
					}),
					client.asyncBatchAnnotateFiles({
						requests: [
							{
								inputConfig: {
									mimeType: "application/pdf",
									gcsSource: { uri: pathToURI(scoringPdfPath) },
								},
								outputConfig: {
									gcsDestination: { uri: pathToURI(scoringTextPath) },
								},
								features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
							},
						],
					}),
				])

				questions = (await bucket.file(questionsTextPath).download())[0].toString("utf8")
				scoring = (await bucket.file(scoringTextPath).download())[0].toString("utf8")
			}

			return { questions, scoring }
		}),
})

export default frqRouter
