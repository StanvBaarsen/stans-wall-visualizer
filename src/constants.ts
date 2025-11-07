// sizes in mm
export const FULL_BRICK_LENGTH = 210;
export const FULL_BRICK_WIDTH = 100;
export const HALF_BRICK_LENGTH = 100;
export const BRICK_HEIGHT = 50;
export const HEAD_JOINT = 10;
export const BED_JOINT = 12.5;
export const COURSE_HEIGHT = BRICK_HEIGHT + BED_JOINT;
export const WALL_WIDTH = 2300;
export const WALL_HEIGHT = 2000;
export const ENVELOPE_WIDTH = 800;
export const ENVELOPE_HEIGHT = 1300;

export interface Brick {
	x: number;
	y: number;
	length: number;
	built: boolean;
	builtDuringStrideNr?: number;
}
