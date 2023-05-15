import { type NextApiHandler } from "next"
import { z } from "zod"
import { v1 as vision } from "@google-cloud/vision"
import pdf2image from "pdf-img-convert"
import sharp from "sharp"
import { getAuth } from "../auth/jwt"
import { env } from "~/env.mjs"

const bodySchema = z.object({
	base64s: z.string().array().min(1),
	isPDF: z.boolean(),
})

const ocrHandler: NextApiHandler = async (req, res) => {
	const auth = await getAuth({ req, res })

	if (!auth) return res.status(401).end()

	let { base64s, isPDF } = bodySchema.parse(req.body)

	if (isPDF) {
		const convertedBase64s: string[] = []

		for (const base64 of base64s) {
			convertedBase64s.push(
				...((await pdf2image.convert(Buffer.from(base64, "base64"), {
					base64: true,
				})) as string[])
			)
		}

		base64s = convertedBase64s
	}

	let buffer: Buffer

	if (base64s.length === 1 && base64s[0]) {
		buffer = await sharp(Buffer.from(base64s[0], "base64")).jpeg().toBuffer()
	} else {
		const buffers = base64s.map((base64) => Buffer.from(base64, "base64"))

		const metadata = await Promise.all(buffers.map((buffer) => sharp(buffer).metadata()))

		const totalHeight = metadata.reduce((sum, metadata) => sum + metadata.height!, 0)

		const maxWidth = metadata.reduce(
			(max, metadata) => (metadata.width! > max ? metadata.width! : max),
			0
		)

		const combinedImage = sharp({
			create: {
				width: maxWidth,
				height: totalHeight,
				channels: 4,
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			},
		})

		let offsetY = 0

		combinedImage.composite(
			buffers.map((buffer, index) => {
				const overlayOptions: sharp.OverlayOptions = {
					input: buffer,
					top: offsetY,
					left: 0,
				}

				offsetY += metadata[index]!.height!

				return overlayOptions
			})
		)

		buffer = await combinedImage.jpeg().toBuffer()
	}

	const client = new vision.ImageAnnotatorClient({ credentials: env.GOOGLE_CREDENTIALS })

	const [result] = await client.documentTextDetection(buffer)

	const text = result.fullTextAnnotation?.text

	if (!text) return res.status(400).end("No text detected")
	console.log(text)
	return res.status(200).end(text)
}

export default ocrHandler
