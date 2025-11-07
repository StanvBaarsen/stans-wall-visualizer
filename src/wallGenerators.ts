import {
	FULL_BRICK_WIDTH,
	HALF_BRICK_WIDTH,
	HEAD_JOINT,
	COURSE_HEIGHT,
	WALL_WIDTH,
	WALL_HEIGHT,
	type Brick,
} from "./constants";

function generateStretcherBond(nRows: number): Brick[] {
	const bricks: Brick[] = [];
	for (let row = 0; row < nRows; row++) {
		const isOdd = row % 2 === 1;
		let x = 0;
		let y = row * COURSE_HEIGHT;

		if (isOdd) {
			bricks.push({ width: HALF_BRICK_WIDTH, x, y, built: false });
			x += HALF_BRICK_WIDTH + HEAD_JOINT;
		}

		while (x + FULL_BRICK_WIDTH <= WALL_WIDTH) {
			bricks.push({ width: FULL_BRICK_WIDTH, x, y, built: false });
			x += FULL_BRICK_WIDTH + HEAD_JOINT;
		}
		if (x <= WALL_WIDTH - HALF_BRICK_WIDTH) {
			bricks.push({ width: HALF_BRICK_WIDTH, x, y, built: false });
			x += HALF_BRICK_WIDTH + HEAD_JOINT;
		}
	}
	return bricks;
}

export const PATTERN_MAP: Record<string, { displayName: string; generator: (nRows: number) => Brick[] }> = {
	stretcher: {
		displayName: "Stretcher bond",
		generator: generateStretcherBond,
	},
};

export function generateWall(pattern: string): Brick[] {
	const nRows = Math.floor(WALL_HEIGHT / COURSE_HEIGHT);

	if (pattern in PATTERN_MAP) {
		return PATTERN_MAP[pattern].generator(nRows);
	}

	return [];
}
