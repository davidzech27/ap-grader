import ocrHandler from "~/server/modules/ocr/apiRoute"

export default ocrHandler

export const config = {
	api: {
		bodyParser: {
			sizeLimit: "100mb",
		},
	},
}
