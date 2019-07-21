import { capture, MIME } from "screenshot-buffer";
import * as hoggy from "hoggy";
import { writeFileSync, readdirSync, readFileSync } from "fs";
import * as brain from "brain.js";
import * as Jimp from "jimp";

async function init() {
	try {
		const net = new brain.NeuralNetwork({
			hiddenLayers: [10, 10],
			binaryThresh: 0.99
		});

		const trainingData = await Promise.all(
			readdirSync("./src/stars").map(async filename => ({
				input: await hoggy.generate(
					(await Jimp.read(`./src/stars/${filename}`)).grayscale()
						.bitmap
				),
				output: [1]
			}))
		);
		console.log(trainingData);

		net.train(trainingData, {
			errorThresh: 0.008,
			log: true,
			learningRate: 0.2,
			timeout: 60000,
			logPeriod: 1
		});

		const { buffer, width, height } = await capture("mspaint.exe", {
			bringToFront: true,
			mime: MIME.PNG
		});

		const image = await Jimp.read(buffer);
		const imageGray = image.clone().grayscale();

		writeFileSync("grayscale-notepad-raw.jpg", buffer);

		const screenshotSliceQueue = [];

		const stepSize = 15;
		const itemHeight = 172;
		for (let y = 0; y * stepSize + itemHeight <= height; y++) {
			for (let x = 0; x * stepSize + itemHeight <= width; x++) {
				screenshotSliceQueue.push({
					width: itemHeight,
					height: itemHeight,
					x: x * stepSize,
					y: y * stepSize
				});
			}
		}

		const screenshotSlices = await screenshotSliceQueue.reduce(
			async (lastPromise, slice) =>
				await lastPromise.then(lastValue =>
					hoggy
						.generate(
							imageGray
								.clone()
								.crop(
									slice.x,
									slice.y,
									slice.width,
									slice.height
								).bitmap
						)
						.then(hog =>
							lastValue.concat({
								...slice,
								weight: net.run(hog)[0]
							})
						)
				),
			Promise.resolve([])
		);
		const output = screenshotSlices
			.sort(({ weight: a }, { weight: b }) => a - b)
			.slice(0, 5)
			.forEach((slice, i) => {
				console.log(slice);
				const { width, x, y, height, weight } = slice;
				drawRect(image, 0xed143dff, 2, x, y, width, height);
			});
		image.write(`./foundStars.png`);
	} catch (e) {
		console.error(e);
	}
}

function drawRect(image: Jimp, colour, thickness, x, y, width, height): Jimp {
	const fillCrimson = function(x, y, offset) {
		image.bitmap.data.writeUInt32BE(colour, offset);
	};
	image.scan(x, y, width, thickness, fillCrimson);
	image.scan(x, y + height, width, thickness, fillCrimson);
	image.scan(x, y, thickness, height, fillCrimson);
	image.scan(x + width, y, thickness, height, fillCrimson);

	return image;
}
init();
