const authenticateWithGoogle = async () => {
	const url = await (
		await fetch("/api/authenticate", {
			method: "POST",
		})
	).text()

	window.location.href = url
}

export default authenticateWithGoogle
