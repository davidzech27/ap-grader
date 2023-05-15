import * as cheerio from "cheerio"
import { Storage } from "@google-cloud/storage"
import { getFRQPath } from "~/cloudStorage"

const urls = [
	"https://apcentral.collegeboard.org/courses/ap-seminar/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-art-history/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-english-language-and-composition/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-english-literature-and-composition/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-comparative-government-and-politics/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-european-history/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-human-geography/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-macroeconomics/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-microeconomics/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-psychology/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-united-states-government-and-politics/exam/ap-us-government-and-politics-past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-united-states-history/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-world-history/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-computer-science-a/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-statistics/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-biology/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-chemistry/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-environmental-science/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-physics-1/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-physics-2/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-physics-c-electricity-and-magnetism/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-physics-c-mechanics/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-chinese-language-and-culture/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-french-language-and-culture/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-german-language-and-culture/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-italian-language-and-culture/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-japanese-language-and-culture/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-latin/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-spanish-language-and-culture/exam/past-exam-questions",
	"https://apcentral.collegeboard.org/courses/ap-spanish-literature-and-culture/exam/past-exam-questions",
]

const getHTML = async (url: string) => {
	const response = (await fetch(url)).body!.getReader()

	let html = ""

	while (true) {
		const chunk = await response.read()
		if (chunk.done) break
		html += Buffer.from(chunk.value).toString("utf8")
	}

	return html
}

const bucket = new Storage({ credentials: {} }).bucket("frqs")

const main = async () => {
	let uploadCount = 0

	for (const url of urls) {
		const course = url.split("/").at(-3)

		if (!course) throw "No course"

		const yearToSetToPdfsMap = new Map<
			number,
			Map<number | undefined, { type: "questions" | "scoring"; url: string }[]>
		>()

		const html = await getHTML(url)

		const $ = cheerio.load(html)

		$("a").each((_index, element) => {
			const anchor = $(element)

			let href = anchor.attr("href")

			if (!href?.endsWith(".pdf")) return

			if (!href.startsWith("http")) href = url.slice(0, url.indexOf("/", 8)) + href

			const text = anchor.text().trim()

			const set = text.includes(" - Set ") ? Number(text.at(-1)) : undefined

			let type = undefined as "questions" | "scoring" | undefined

			if (text.includes("Free-Response Questions") || text.includes("All Questions"))
				type = "questions"

			if (text.includes("Scoring Guidelines")) type = "scoring"

			if (type === undefined) return

			const tableText = anchor.parent().parent().parent().text()

			if (
				!tableText.includes("Free-Response Questions") &&
				!tableText.includes("All Questions")
			)
				return

			const year = Number(
				anchor
					.parent()
					.parent()
					.parent()
					.parent()
					.parent()
					.parent()
					.parent()
					.parent()
					.children()
					.first()
					.children()
					.first()
					.children()
					.first()
					.text()
					.trim()
					.slice(0, 4)
			)

			let setToPdfsMap = yearToSetToPdfsMap.get(year)

			if (setToPdfsMap === undefined) {
				setToPdfsMap = new Map()

				yearToSetToPdfsMap.set(year, setToPdfsMap)
			}

			setToPdfsMap.set(set, (setToPdfsMap.get(set) ?? []).concat({ type, url: href }))
		})

		for (const [year, setToPdfsMap] of yearToSetToPdfsMap) {
			for (const [set, pdfs] of setToPdfsMap) {
				const { questions, scoring } = pdfs.reduce(
					(prev, cur) =>
						cur.type === "questions"
							? { ...prev, questions: prev.questions + 1 }
							: { ...prev, scoring: prev.scoring + 1 },
					{ questions: 0, scoring: 0 }
				)

				if (scoring === 0 || questions === 0 || scoring !== questions) continue

				for (const pdf of pdfs) {
					const path = getFRQPath({ course, year, set, type: pdf.type })

					const url = pdf.url

					const buffer = Buffer.from(await (await fetch(url)).arrayBuffer())

					await bucket.file(path).save(buffer)

					uploadCount++

					console.info(`Uploaded to path ${path}`)
				}
			}
		}
	}

	console.info(`Uploaded ${uploadCount} pdfs`)
}

void main()
