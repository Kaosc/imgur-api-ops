/**
 * Acces Token Endpoint
 * https://api.imgur.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&response_type=token
 */

import dotenv from "dotenv"

dotenv.config()

const accessToken = process.env.ACCESS_TOKEN

if (accessToken) {
	console.debug(">> Running with access token")
} else {
	console.debug(">> Running without access token")
}

const headers = {
	Authorization: `Bearer ${accessToken}`,
	"Content-Type": "application/json",
}

// Step 1: Create an Album called "Cats"
async function createAlbum() {
	const albumData = {
		title: "Cats",
		privacy: "hidden", // You can change this to 'public' or 'secret'
	}

	const response = await fetch("https://api.imgur.com/3/album", {
		method: "POST",
		headers: headers,
		body: JSON.stringify(albumData),
	})

	const data = await response.json()
	if (response.ok) {
		console.log(`Album created with ID: ${data.data.id}`)
		return data.data.id
	} else {
		console.error("Failed to create album:", data)
		throw new Error("Failed to create album")
	}
}

// Get all Albums
async function getAlbums() {
	const response = await fetch("https://api.imgur.com/3/account/me/albums", {
		method: "GET",
		headers: headers,
	})

	const data = await response.json()
	if (response.ok) {
		console.log(`Albums found: ${data.data.length}`)
		return data.data
	} else {
		console.error("Failed to fetch albums:", data)
		throw new Error("Failed to fetch albums")
	}
}

async function getAlbumIDbyTitle(albumTitle) {
	const albums = await getAlbums()
	const album = albums.find((album) => album.title === albumTitle)
	return album.id
}

// Step 2: Get All Images, handling pagination
async function getAllImages() {
	let page = 0
	let allImages = []
	let hasMoreImages = true

	while (hasMoreImages) {
		const response = await fetch(`https://api.imgur.com/3/account/me/images?page=${page}&perPage=50`, {
			method: "GET",
			headers: headers,
		})

		const data = await response.json()
		if (response.ok) {
			allImages = allImages.concat(data.data)
			console.log(`Page ${page + 1}: Found ${data.data.length} images.`)
			hasMoreImages = data.data.length > 0
			page++
		} else {
			console.error("Failed to fetch images:", data)
			throw new Error("Failed to fetch images")
		}
	}

	console.log(`Total images found: ${allImages.length}`)
	return allImages
}

// Step 3: Get All Album Images
async function getAllAlbumImages() {
	let page = 0
	let albumImageIds = new Set()
	let hasMoreAlbums = true

	while (hasMoreAlbums) {
		const response = await fetch(`https://api.imgur.com/3/account/me/albums?page=${page}&perPage=50`, {
			method: "GET",
			headers: headers,
		})

		const data = await response.json()
		if (response.ok) {
			const albumIds = data.data.map((album) => album.id)
			for (const albumId of albumIds) {
				const albumImagesResponse = await fetch(`https://api.imgur.com/3/album/${albumId}/images`, {
					method: "GET",
					headers: headers,
				})

				const albumImagesData = await albumImagesResponse.json()
				if (albumImagesResponse.ok) {
					albumImagesData.data.forEach((img) => albumImageIds.add(img.id))
				} else {
					console.error("Failed to fetch album images:", albumImagesData)
					throw new Error("Failed to fetch album images")
				}
			}
			console.log(`Page ${page + 1}: Found ${data.data.length} albums.`)
			hasMoreAlbums = data.data.length > 0
			page++
		} else {
			console.error("Failed to fetch albums:", data)
			throw new Error("Failed to fetch albums")
		}
	}

	console.log(`Total album images found: ${albumImageIds.size}`)
	return albumImageIds
}

// Step 4: Filter Non-Album Images
function filterNonAlbumImages(allImages, albumImageIds) {
	const nonAlbumImages = allImages.filter((img) => !albumImageIds.has(img.id))
	console.log(`Found ${nonAlbumImages.length} non-album images.`)
	return nonAlbumImages.map((img) => img.id)
}

// Step 5: Add Non-Album Images to the Album
async function addImagesToAlbum(albumId, imageIds) {
	const response = await fetch(`https://api.imgur.com/3/album/${albumId}/add`, {
		method: "POST",
		headers: headers,
		body: JSON.stringify({ ids: imageIds }),
	})

	const data = await response.json()
	if (response.ok) {
		console.log("Images added to the album successfully.")
	} else {
		console.error("Failed to add images to the album:", data)
		throw new Error("Failed to add images to the album")
	}
}

; (async () => {
	return

	try {
		/**
		 * CREATE ALBUM
		 */
		// const albumId = await createAlbum()

		/**
		 * GET ALBUM BY TITLE
		 */
		const albumId = await getAlbumIDbyTitle("Cats")

		/**
		 * GET ALL NON-ALBUM IMAGES
		 */
		const allImages = await getAllImages()
		const albumImageIds = await getAllAlbumImages()
		const nonAlbumImages = filterNonAlbumImages(allImages, albumImageIds)

		/**
		 * ADD NON-ALBUM IMAGES TO THE SPECIFIED ALBUM
		 */
		if (nonAlbumImages.length > 0) {
			await addImagesToAlbum(albumId, nonAlbumImages)
		} else {
			console.log("No non-album images found to add to the album.")
		}
	} catch (e) {
		console.error("Error:", e)
	}
})()
