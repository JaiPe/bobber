import * as windowSnap from 'screenshot-buffer';
import hoggy from 'hoggy';
import { writeFileSync, readdirSync } from 'fs';

async function init() {
	try {
		const files = readdirSync('./src/stars').map(() => {});
		const { width, height, data } = await windowSnap.capture('mspaint.exe', { bringToFront: true, grayscale: true, quality: 90 });
		writeFileSync('grayscale-notepad.jpg', data);
	} catch(e) {
		console.error(e);
	}
}

init();