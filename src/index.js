const windowSnap = require('screenshot-buffer');
const hoggy = require('hoggy');
const { writeFileSync, readdirSync } = require('fs');

try {
	const files = readdirSync('./src/stars').map(() => {});
	const imageData = windowSnap.capture('mspaint.exe', { bringToFront: true, grayscale: true, quality: 90 });
	writeFileSync('grayscale-notepad.jpg', Buffer.from(imageData.data));
} catch(e) {
	console.error(e);
}
