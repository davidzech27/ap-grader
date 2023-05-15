export const getFRQPath = ({
	course,
	year,
	set,
	type,
}: {
	course: string
	year: number
	set?: number
	type: "questions" | "scoring"
}) => `/${course}/${set === undefined ? year : `${year}-${set}`}/${type}.pdf`

export const getFRQInfoFromPath = (path: string) => {
	const [_, course, yearAndSet] = path.split("/")

	const year = Number(yearAndSet?.slice(0, 4))

	const set = yearAndSet?.length === 6 ? Number(yearAndSet.at(-1)) : undefined

	return {
		course: course as string,
		year,
		set,
	}
}

export const getFRQURL = (info: {
	course: string
	year: number
	set?: number
	type: "questions" | "scoring"
}) => `https://storage.cloud.google.com/frqs/${getFRQPath(info)}`
