import { useState, type ChangeEventHandler, useMemo } from "react"
import { type NextPage } from "next"
import { api } from "~/client/api"
import { getFRQURL } from "~/cloudStorage"

const Home: NextPage = () => {
	const [stage, setStage] = useState<"pick" | "upload" | "grade">("pick")

	const [selectedFRQ, setSelectedFRQ] = useState<{
		displayName: string
		course: string
		year: number
		set: number | undefined
	}>()

	const frqs = api.frq.getAll.useQuery().data

	const [frqFilterInput, setFRQFilterInput] = useState("")

	const filteredFRQs = frqs?.filter((frq) =>
		frq.displayName.toLowerCase().includes(frqFilterInput.toLowerCase())
	) // useMemo not worth it

	const [frqText, setFRQText] = useState({
		questions: undefined as string | undefined,
		scoring: undefined as string | undefined,
	})

	const queryClient = api.useContext()

	const onPick = async () => {
		if (!selectedFRQ) return

		setStage("upload")

		const { questions, scoring } = await queryClient.frq.getText.fetch(selectedFRQ)
		alert(questions)
		alert(scoring)
		setFRQText({ questions, scoring })
	}

	const [uploadingFiles, setUploadingFiles] = useState(true)

	const [submissionFiles, setSubmissionFiles] = useState<File[]>()

	const [submissionPreviews, setSubmissionPreviews] = useState<string[]>()

	const onChooseSubmission: ChangeEventHandler<HTMLInputElement> = (e) => {
		setUploadingFiles(false)

		const file = e.target.files?.[0]

		if (file) {
			setSubmissionFiles((prev) => [...(prev ?? []), file])

			const fileReader = new FileReader()

			fileReader.onload = (e) =>
				setSubmissionPreviews((prev) =>
					typeof e.target?.result === "string" ? [...(prev ?? []), e.target.result] : prev
				)

			fileReader.readAsDataURL(file)
		}
	}

	const [submissionText, setSubmissionText] = useState<string>()

	const onUpload = async () => {
		if (!submissionFiles) return

		setStage("grade")

		setSubmissionFiles(undefined)
		setSubmissionPreviews(undefined)
		setUploadingFiles(true)

		const base64s: string[] = []

		for (const submission of submissionFiles) {
			base64s.push(Buffer.from(await submission.arrayBuffer()).toString("base64"))
		}

		setSubmissionText(
			await (
				await fetch("/api/ocr", {
					method: "POST",
					body: JSON.stringify({
						base64s,
						isPDF: submissionFiles[0]?.type === "application/pdf",
					}),
					headers: {
						"Content-Type": "application/json",
						Accept: "text/plain",
					},
				})
			).text()
		)
	}

	const onTryAgain = () => {
		setStage("pick")

		setSubmissionText(undefined)
	}

	return (
		<div className="flex h-full flex-col px-12 py-8">
			{stage === "pick" ? (
				<>
					<div className="px-1 pb-5 text-4xl font-semibold">Pick an FRQ</div>

					<div className="flex-1 overflow-y-scroll rounded-md border border-white/[0.45] px-6 py-5 transition hover:border-white/[0.6]">
						{filteredFRQs === undefined ? (
							<div className="text-3xl">Fetching FRQs...</div>
						) : (
							<>
								<input
									type="text"
									placeholder="Search"
									value={frqFilterInput}
									onChange={(e) => setFRQFilterInput(e.target.value)}
									className="mb-4 h-16 w-full rounded-md border border-white/[0.45] bg-transparent px-4 text-3xl font-medium outline-none transition placeholder:text-white placeholder:opacity-60 hover:border-white/[0.6] focus:border-white"
								/>

								<div className="flex w-full flex-wrap gap-3">
									{filteredFRQs.length === 0 ? (
										<div className="ml-1 text-3xl font-semibold">
											No FRQs match your search query :(
										</div>
									) : (
										filteredFRQs.map((frq) => (
											<div
												onClick={() =>
													selectedFRQ?.displayName === frq.displayName
														? setSelectedFRQ(undefined)
														: setSelectedFRQ(frq)
												}
												key={frq.displayName}
												className={`w-full cursor-pointer rounded-md border px-5 py-4 transition md:w-[calc(50%-16px)] lg:w-[calc(33%-16px)] ${
													selectedFRQ?.displayName === frq.displayName
														? "border-white"
														: "border-white/[0.45] hover:border-white/[0.6]"
												}`}
											>
												<div className="text-xl font-semibold">
													{frq.displayName}
												</div>

												<div className="mt-1 select-none text-sm font-semibold opacity-60">
													QUESTIONS
												</div>

												<div className="mt-0.5 text-sm font-medium underline">
													<a
														href={getFRQURL({
															...frq,
															type: "questions",
														})}
														target="_blank"
													>
														{getFRQURL({
															...frq,
															type: "questions",
														})}
													</a>
												</div>

												<div className="mt-1 select-none text-sm font-semibold opacity-60">
													SCORING
												</div>

												<div className="mt-0.5 text-sm font-medium underline">
													<a
														href={getFRQURL({
															...frq,
															type: "scoring",
														})}
														target="_blank"
													>
														{getFRQURL({
															...frq,
															type: "scoring",
														})}
													</a>
												</div>
											</div>
										))
									)}
								</div>
							</>
						)}
					</div>

					<div className="flex h-[7.5rem] space-x-6 pt-5">
						<button
							onClick={onPick}
							disabled={!selectedFRQ}
							className={`w-full rounded-md bg-white text-4xl font-semibold text-black transition hover:opacity-80 disabled:opacity-60`}
						>
							Continue
						</button>
					</div>
				</>
			) : stage === "upload" ? (
				<>
					<div className="px-1 pb-5 text-4xl font-semibold">Upload your work</div>

					<div
						className={`flex-1 overflow-y-scroll rounded-md border transition ${
							submissionPreviews
								? "border-white"
								: "border-white/[0.45] hover:border-white/[0.6]"
						}`}
					>
						{submissionPreviews && (
							<div className="h-full overflow-y-scroll rounded-md">
								{submissionPreviews.map((submissionPreview, index) =>
									submissionPreview.startsWith("data:application/pdf") ? (
										<iframe
											src={submissionPreview}
											key={index} // fine
											className="h-full w-full" // not working for every pdf
										/>
									) : (
										<img
											src={submissionPreview}
											key={index} // fine
											alt="Your work"
											className="w-full"
										/>
									)
								)}
							</div>
						)}
					</div>

					<div className="flex h-[7.5rem] space-x-6 pt-5">
						{uploadingFiles ? (
							<>
								<button className="relative w-full rounded-md bg-white text-4xl font-semibold text-black transition hover:opacity-80">
									Choose a file
									<input
										id="file-input"
										type="file"
										accept={
											submissionFiles?.[0]
												? submissionFiles[0].type
												: "image/png, image/jpeg, application/pdf"
										}
										onChange={onChooseSubmission}
										className="absolute left-0 top-0 z-10 h-full w-full cursor-pointer rounded-md border opacity-0"
									/>
								</button>
								<button className="group relative w-full rounded-md border-[4px] border-white text-4xl font-semibold text-white transition hover:text-black">
									Take a photo
									<div className="absolute top-0 -z-10 h-full w-full bg-white opacity-0 transition group-hover:opacity-100" />
								</button>
							</>
						) : (
							<>
								<button
									onClick={onUpload}
									className="w-full rounded-md bg-white text-4xl font-semibold text-black transition hover:opacity-80"
								>
									Grade FRQs
								</button>

								<button
									onClick={() => setUploadingFiles(true)}
									className="group relative w-full rounded-md border-[4px] border-white text-4xl font-semibold text-white transition hover:text-black"
								>
									Pick another file
									<div className="absolute top-0 -z-10 h-full w-full bg-white opacity-0 transition group-hover:opacity-100" />
								</button>
							</>
						)}
					</div>
				</>
			) : (
				<>
					<div className="flex-1 overflow-y-scroll rounded-md border border-white/[0.45] px-6 py-5 transition hover:border-white/[0.6]">
						{submissionText === undefined ? (
							<div className="text-3xl">Scanning submission for text...</div>
						) : (
							<div className="whitespace-pre-wrap">{submissionText}</div>
						)}
					</div>

					<div className="flex h-[7.5rem] space-x-6 pt-5">
						<button
							onClick={onTryAgain}
							className={`w-full rounded-md bg-white text-4xl font-semibold text-black transition hover:opacity-80 disabled:opacity-60`}
						>
							Try again
						</button>
					</div>
				</>
			)}
		</div>
	)
}

export default Home
