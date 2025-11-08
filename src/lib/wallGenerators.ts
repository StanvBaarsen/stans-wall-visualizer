import {
	FULL_BRICK_LENGTH,
	FULL_BRICK_WIDTH,
	HALF_BRICK_LENGTH,
	HEAD_JOINT,
	COURSE_HEIGHT,
	WALL_WIDTH,
	WALL_HEIGHT,
	type Brick,
} from "./constants";

function generateStretcherBond(): Brick[] {
	const nRows = Math.floor(WALL_HEIGHT / COURSE_HEIGHT);
	const bricks: Brick[] = [];

	for (let row = 0; row < nRows; row++) {
		const isOdd = row % 2 === 1;
		let x = 0;
		let y = row * COURSE_HEIGHT;

		if (isOdd) {
			// start the course with a half brick
			bricks.push({ length: HALF_BRICK_LENGTH, x, y, built: false });
			x += HALF_BRICK_LENGTH + HEAD_JOINT;
		}

		while (x + FULL_BRICK_LENGTH <= WALL_WIDTH) {
			bricks.push({ length: FULL_BRICK_LENGTH, x, y, built: false });
			x += FULL_BRICK_LENGTH + HEAD_JOINT;
		}

		// fill up any remaining space with a final brick
		if (x < WALL_WIDTH) {
			bricks.push({ length: WALL_WIDTH - x, x, y, built: false });
			x = WALL_WIDTH;
		}
	}
	return bricks;
}

// based on: https://www.bradley-mason.com/party-wall/a-guide-to-brick-bonds/
function generateEnglishCrossBond(): Brick[] {
	const nRows = Math.floor(WALL_HEIGHT / COURSE_HEIGHT);
	const bricks: Brick[] = [];

	for (let row = 0; row < nRows; row++) {
		let x = 0;
		let y = row * COURSE_HEIGHT;

		if (row % 2) {
			// header course
			// start header courses with a specific small brick, such that the first half-brick of
			// the course aligns perfectly in the middle of the full brick below it.
			bricks.push({ length: FULL_BRICK_LENGTH / 4 - HEAD_JOINT, x, y, built: false })
			x += FULL_BRICK_LENGTH / 4;

			while (x + FULL_BRICK_WIDTH <= WALL_WIDTH) {
				bricks.push({ length: FULL_BRICK_WIDTH, x, y, built: false });
				x += FULL_BRICK_WIDTH + HEAD_JOINT;
			}
		} else {
			// stretcher course: add bricks lengthwise
			while (x + FULL_BRICK_LENGTH <= WALL_WIDTH) {
				bricks.push({ length: FULL_BRICK_LENGTH, x, y, built: false });
				x += FULL_BRICK_LENGTH + HEAD_JOINT;
			}
		}

		// fill up any remaining space with a final brick
		if (x < WALL_WIDTH) {
			bricks.push({ length: WALL_WIDTH - x, x, y, built: false });
			x = WALL_WIDTH;
		}
	}

	return bricks;
}

// based on: https://www.wienerberger.nl/informatie/gevel/verbanden-in-metselwerk.html
function generateFlemishBond(): Brick[] {
	const nRows = Math.floor(WALL_HEIGHT / COURSE_HEIGHT);
	const bricks: Brick[] = [];

	for (let row = 0; row < nRows; row++) {
		let x = 0;
		let y = row * COURSE_HEIGHT;
		let brickNrInRow = 0;

		if (row % 2 == 1) {
			// start odd courses with a specific small brick, such that the first half-brick of
			// the course aligns perfectly in the middle of the full brick below it.
			bricks.push({ length: FULL_BRICK_LENGTH / 4 - HEAD_JOINT, x, y, built: false })
			x += FULL_BRICK_LENGTH / 4;
		}

		while (x + FULL_BRICK_LENGTH <= WALL_WIDTH) {
			// stretchers and headers should alternate
			// but the first row should start with a stretcher,
			// while the second row should start with a header
			if ((brickNrInRow + row) % 2 === 0) {
				// stretcher
				bricks.push({ length: FULL_BRICK_LENGTH, x, y, built: false });
				x += FULL_BRICK_LENGTH + HEAD_JOINT;
			} else {
				// header
				bricks.push({ length: FULL_BRICK_WIDTH, x, y, built: false });
				x += FULL_BRICK_WIDTH + HEAD_JOINT;
			}
			brickNrInRow++;
		}

		// fill up any remaining space with a final brick
		if (x < WALL_WIDTH) {
			bricks.push({ length: WALL_WIDTH - x, x, y, built: false })
			x += FULL_BRICK_LENGTH / 4;
			brickNrInRow++;
		}
	}

	return bricks;
}



export const PATTERN_MAP: Record<string, { displayName: string; generator: () => Brick[] }> = {
	stretcher: {
		displayName: "Stretcher bond",
		generator: generateStretcherBond,
	},
	englishCross: {
		displayName: "English cross bond",
		generator: generateEnglishCrossBond,
	},
	flemish: {
		displayName: "Flemish bond",
		generator: generateFlemishBond,
	},
};

export function generateWall(pattern: string): Brick[] {
	if (pattern in PATTERN_MAP) {
		return PATTERN_MAP[pattern].generator();
	}

	return [];
}