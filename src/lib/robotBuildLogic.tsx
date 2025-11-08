
import {
	BRICK_HEIGHT,
	BED_JOINT,
	COURSE_HEIGHT,
	WALL_HEIGHT,
	ENVELOPE_WIDTH,
	ENVELOPE_HEIGHT,
	type Brick,
} from "./constants";

interface Ref<T> {
	current: T
}

interface RobotLocation {
	x: number;
	y: number;
}



// for a given brick and a set of bricks, return whether the brick's left and right edges are supported 
function brickCanBeBuilt(brick: Brick, allBricks: Brick[]): boolean {
	if (brick.y === 0) return true;
	const leftX = brick.x;
	const rightX = brick.x + brick.length;
	const belowY = brick.y - (BRICK_HEIGHT + BED_JOINT);

	const isSupported = (xEdge: number) =>
		allBricks.some((b) => {
			if (!b.built || b.y !== belowY) return false;
			return b.x <= xEdge && b.x + b.length >= xEdge;
		});

	return isSupported(leftX) && isSupported(rightX);
}

function fitsWithinRobotWindow(brick: Brick, r: { x: number; y: number }) {
	return (
		brick.x >= r.x - ENVELOPE_WIDTH / 2 &&
		brick.x + brick.length <= r.x + ENVELOPE_WIDTH / 2 &&
		brick.y >= r.y - ENVELOPE_HEIGHT / 2 &&
		brick.y + BRICK_HEIGHT <= r.y + ENVELOPE_HEIGHT / 2
	);
}

// from a given robot position, calculate how many bricks can be built
function countBuildableFromPosition(bricksArray: Brick[], robotPosition: { x: number; y: number }): number {
	// copy array
	let workingBricks = bricksArray.map(b => ({ ...b }));
	let count = 0;

	while (true) {
		const unbuilt = workingBricks.filter((b) => !b.built);
		if (!unbuilt.length) break;

		const inWindow = unbuilt.filter((b) => fitsWithinRobotWindow(b, robotPosition));
		const buildable = inWindow.filter((b) => brickCanBeBuilt(b, workingBricks));

		if (buildable.length === 0) {
			break;
		}

		// build the first buildable brick
		const nextBrick = buildable[0];
		workingBricks = workingBricks.map((b) => b == nextBrick ? { ...b, built: true } : b);
		count++;
	}

	return count;
}


export function calculateNewRobotPosition( bricksRef: Ref<Brick[]>, robotRef: Ref<RobotLocation>, wall?: Brick[]): RobotLocation {
	if (!wall) wall = bricksRef.current;
	// find the lowest uncompleted course
	const nRows = Math.floor(WALL_HEIGHT / COURSE_HEIGHT);
	let course = 0;
	for (; course < nRows; course++) {
		let courseBricks = wall.filter((b) => b.y === course * COURSE_HEIGHT);
		const allBuilt = courseBricks.every((b) => b.built);
		if (!allBuilt) {
			break;
		}
	}

	// now we know we want the robot to be on the y position where the envelope just contains this course
	const newY = Math.min(course * COURSE_HEIGHT + ENVELOPE_HEIGHT / 2, WALL_HEIGHT - ENVELOPE_HEIGHT / 2);

	// now, we're going to move the envelope and try to maximize the number of bricks the robot
	// can build in a single stride.
	// we consider putting the envelope's left edge at each brick's left edge, and the envelope's right edge at each brick's right edge, (skipping duplicates of course)
	// and see which position would allow the most bricks to be built
	let bestX = robotRef.current.x;
	let maxBuildable = -1;

	let candidateXPositions: number[] = wall.flatMap((b) => [b.x + ENVELOPE_WIDTH / 2, b.x + b.length - ENVELOPE_WIDTH / 2]);
	candidateXPositions = candidateXPositions.filter((x, index) => candidateXPositions.indexOf(x) === index); // only uniques

	for (let i = 0; i < candidateXPositions.length; i++) {
		const buildableCount = countBuildableFromPosition(wall, { x: candidateXPositions[i], y: newY });

		if (buildableCount === maxBuildable) {
			// choose the position closest to the robot
			const currentDistance = Math.abs(bestX - robotRef.current.x);
			const newDistance = Math.abs(candidateXPositions[i] - robotRef.current.x);
			if (newDistance < currentDistance) {
				bestX = candidateXPositions[i];
			}
		}
		if (buildableCount > maxBuildable) {
			maxBuildable = buildableCount;
			bestX = candidateXPositions[i];
		}
	}

	return { x: bestX, y: newY };
}

// function that executes the next step in the build process:
// either it builds the next available brick or, if there are none left from its current position, it moves the robot
export async function doNextBuildStep(busyRef: Ref<boolean>, bricksRef: Ref<Brick[]>, robotRef: Ref<RobotLocation>, setShowBuiltToast: (showToast: boolean) => void, strideCountRef: Ref<number>, robotDistanceTravelledRef: Ref<number>, setBricks: (bricks: Brick[]) => void, setRobot: (loc: RobotLocation) => void, setStrideCount: (count: number) => void, setRobotDistanceTravelled: (distance: number) => void) {
	if (busyRef.current) return;
	busyRef.current = true;

	const allBricks = bricksRef.current;
	const robotLoc = robotRef.current;
	const unbuilt = allBricks.filter((b) => !b.built);
	if (!unbuilt.length) {
		busyRef.current = false;
		setShowBuiltToast(true);
		setTimeout(() => setShowBuiltToast(false), 1500);
		return;
	}

	const inWindow = unbuilt.filter((b) => fitsWithinRobotWindow(b, robotLoc));
	const buildable = inWindow.filter((b) => brickCanBeBuilt(b, allBricks));

	if (buildable.length) {
		// just build the next available brick (because you want to build all
		// the buildable bricks from a given robot position anyway before you move it, and the order in which
		// you build the individual bricks does not matter for how many strides you make)

		const next = buildable[0];
		const strideNr = strideCountRef.current + 1;
		const updated = allBricks.map((b) =>
			b === next ? { ...b, built: true, builtDuringStrideNr: strideNr } : b
		);
		bricksRef.current = updated;
		setBricks(updated);
	} else {
		const newRobotPos = calculateNewRobotPosition(bricksRef, robotRef);
		const oldRobotX = robotRef.current.x;
		const oldRobotY = robotRef.current.y;

		if (!(newRobotPos.x === robotLoc.x && newRobotPos.y === robotLoc.y)) {
			robotRef.current = newRobotPos;
			setRobot(newRobotPos);

			// update stats
			setStrideCount(strideCountRef.current + 1);
			const distance = Math.sqrt(
				Math.pow(newRobotPos.x - oldRobotX, 2) +
				Math.pow(newRobotPos.y - oldRobotY, 2)
			);
			setRobotDistanceTravelled(robotDistanceTravelledRef.current + distance);
		}
	}

	await new Promise((res) => setTimeout(res, 30)); // small delay for animation
	busyRef.current = false;
}