import React, { useEffect, useState, useRef } from "react";
import { InfoBox } from "./InfoBox";
import { WallVisualization } from "./WallVisualization";
import {
	BRICK_HEIGHT,
	BED_JOINT,
	COURSE_HEIGHT,
	WALL_WIDTH,
	WALL_HEIGHT,
	ENVELOPE_WIDTH,
	ENVELOPE_HEIGHT,
	type Brick,
} from "./constants";
import { generateWall } from "./wallGenerators.ts";


const App: React.FC = () => {
	const [bricks, setBricks] = useState<Brick[]>([]);
	// initial robot position should have envelope's bottom-left corner at (0,0)
	const [robot, setRobot] = useState<{ x: number; y: number }>({ x: ENVELOPE_WIDTH / 2, y: ENVELOPE_HEIGHT / 2 });
	const [strideCount, setStrideCount] = useState(0);
	const [isBuildingEntireWall, setIsBuildingEntireWall] = useState(false);
	const [showStats, setShowStats] = useState(false);
	const [robotDistanceTravelled, setRobotDistanceTravelled] = useState(0);
	const [useDistinctStrideColors, setUseDistinctStrideColors] = useState(false);
	const [showRobot, setShowRobot] = useState(true);
	const [showEnvelope, setShowEnvelope] = useState(true);
	const [showStrideLabels, setShowStrideLabels] = useState(false);
	const [pixelsPerMM, setPixelsPerMM] = useState(0.25);
	const [isEditingRobotX, setIsEditingRobotX] = useState(false);
	const [isEditingRobotY, setIsEditingRobotY] = useState(false);
	const [showBuiltToast, setShowBuiltToast] = useState(false);
	const [pattern, setPattern] = useState("stretcher");



	const bricksRef = useRef<Brick[]>([]);
	const robotRef = useRef(robot);
	const strideCountRef = useRef(strideCount);
	const isBuildingEntireWallRef = useRef(isBuildingEntireWall);
	const patternSelectRef = useRef<HTMLSelectElement | null>(null);
	useEffect(() => { bricksRef.current = bricks; }, [bricks]);
	useEffect(() => { robotRef.current = robot; }, [robot]);
	useEffect(() => { strideCountRef.current = strideCount; }, [strideCount]);
	useEffect(() => { isBuildingEntireWallRef.current = isBuildingEntireWall; }, [isBuildingEntireWall]);

	const busyRef = useRef(false);


	const reset = () => {
		setIsBuildingEntireWall(false);
		setBricks(generateWall(pattern));
		setRobot({ x: ENVELOPE_WIDTH / 2, y: ENVELOPE_HEIGHT / 2 });
		setStrideCount(0);
		setRobotDistanceTravelled(0);
	};

	const resetRef = useRef<() => void>(reset);
	useEffect(() => {
		resetRef.current = reset;
	}, [reset]);

	function brickCanBeBuilt(brick: Brick, all: Brick[]): boolean {
		if (brick.y === 0) return true;
		const leftX = brick.x;
		const rightX = brick.x + brick.length;
		const belowY = brick.y - (BRICK_HEIGHT + BED_JOINT);

		const isSupported = (xEdge: number) =>
			all.some((b) => {
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

	function getCourse(courseNumber: number): Brick[] {
		const courseY = courseNumber * COURSE_HEIGHT;
		return bricksRef.current.filter((b) => b.y === courseY);
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

	function calculateNewRobotPosition(robotPos: { x: number; y: number }) {
		// find the lowest uncompleted course
		const nRows = Math.floor(WALL_HEIGHT / COURSE_HEIGHT);
		let course = 0;
		let courseBricks: Brick[] = [];
		for (; course < nRows; course++) {
			courseBricks = getCourse(course);
			const allBuilt = courseBricks.every((b) => b.built);
			if (!allBuilt) {
				break;
			}
		}

		// now we know we want the robot to be on the y position where the envelope just contains this course
		const newY = Math.min(course * COURSE_HEIGHT + ENVELOPE_HEIGHT / 2, WALL_HEIGHT - ENVELOPE_HEIGHT / 2);
		// now, we're going to move the envelope and try to maximize the number of bricks the robot would
		// be able to build in a single stride


		// we put the envelope's left edge at each brick's left edge, and it's right edge at each brick's right edge, (skipping duplicates of course)
		// and see which position would allow the most bricks to be built
		let bestX = robotPos.x;
		let maxBuildable = -1;

		let candidateXPositions = bricksRef.current.flatMap((b) => [b.x + ENVELOPE_WIDTH / 2, b.x + b.length - ENVELOPE_WIDTH / 2]);
		candidateXPositions = candidateXPositions.filter((x, index) => candidateXPositions.indexOf(x) === index); // uniques

		for (let i = 0; i < candidateXPositions.length; i++) {
			const buildableCount = countBuildableFromPosition(bricksRef.current, { x: candidateXPositions[i], y: newY });


			if (buildableCount === maxBuildable) {
				// choose the position closest to the robot
				const currentDistance = Math.abs(bestX - robotPos.x);
				const newDistance = Math.abs(candidateXPositions[i] - robotPos.x);
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

	async function buildNextBrick() {
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
			const next = buildable[0];
			const strideNr = strideCountRef.current + 1;
			const updated = allBricks.map((b) =>
				b === next ? { ...b, built: true, builtDuringStrideNr: strideNr } : b
			);
			bricksRef.current = updated;
			setBricks(updated);
		} else {
			const newRobotPos = calculateNewRobotPosition(robotLoc);
			const oldRobotX = robotRef.current.x;
			const oldRobotY = robotRef.current.y;

			if (!(newRobotPos.x === robotLoc.x && newRobotPos.y === robotLoc.y)) {
				robotRef.current = newRobotPos;
				setRobot(newRobotPos);
				setStrideCount((c) => c + 1);

				const distance = Math.sqrt(
					Math.pow(newRobotPos.x - oldRobotX, 2) +
					Math.pow(newRobotPos.y - oldRobotY, 2)
				);
				setRobotDistanceTravelled((d) => d + distance);
			}
		}

		await new Promise((res) => setTimeout(res, 30)); // small delay for animation
		busyRef.current = false;
	}

	const buildEntireWall = async () => {
		setIsBuildingEntireWall(true);
		isBuildingEntireWallRef.current = true;
		while (bricksRef.current.some((b) => !b.built)) {
			if (!isBuildingEntireWallRef.current) break;
			await buildNextBrick();
		}
		setIsBuildingEntireWall(false);
	};

	useEffect(() => {
		const keydownHandler = (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				if (e.shiftKey) {
					buildEntireWall();
				} else if (!isBuildingEntireWallRef.current) {
					buildNextBrick();
				}
			}

			const keyboardActions: Record<string, () => void> = {
				s: () => setShowStats((s) => !s),
				escape: () => setIsBuildingEntireWall(false),
				c: () => setUseDistinctStrideColors((v) => !v),
				n: () => setShowStrideLabels((v) => !v),
				i: () => setShowRobot((v) => !v),
				e: () => setShowEnvelope((v) => !v),
				r: () => resetRef.current(),
				p: () => {
					const select = patternSelectRef.current;
					if (!select) return;
					const selectable = select as HTMLSelectElement & { showPicker?: () => void };
					if (typeof selectable.showPicker === "function") {
						selectable.showPicker();
						return;
					}
				},
			}

			const action = keyboardActions[e.key.toLowerCase()];
			if (action) action();

		};
		window.addEventListener("keydown", keydownHandler);
		return () => window.removeEventListener("keydown", keydownHandler);
	}, []);

	useEffect(() => {
		reset();
	}, [pattern]);

	useEffect(() => {
		const handleResize = () => {
			// make the wall at least 300px but no more than the window height minus a margin (240px)
			// for the header
			let wallHeightInPx = Math.max(innerHeight - 280, 300);

			// also make sure the wall is not wider than the window width minus a margin (40px)
			wallHeightInPx = Math.min(wallHeightInPx, (innerWidth - 40) * (WALL_HEIGHT / WALL_WIDTH));

			setPixelsPerMM(wallHeightInPx / WALL_HEIGHT);
		};
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);


	return (
		<div id="main">
			<header>
				<h1>Stan's Wall Visualizer</h1>
			</header>
			<div id="instructions">
				{isBuildingEntireWall ?
					<>
						<p>
							Building the entire wall...
						</p>
						<p id="entireWallHint" onClick={() => setIsBuildingEntireWall(false)} style={{ cursor: "pointer" }}>
							(press <kbd>Esc</kbd> to cancel)
						</p>
					</>
					:
					<>
						<p onClick={() => buildNextBrick()} style={{ cursor: "pointer" }}>
							Press <kbd>Enter</kbd> to build the next brick.
						</p>
						<p id="entireWallHint" onClick={() => buildEntireWall()} style={{ cursor: "pointer" }}>
							(or <kbd>Shift</kbd> + <kbd>Enter</kbd> to build the entire wall!)
						</p>
					</>
				}
			</div >

			<WallVisualization
				bricks={bricks}
				robot={robot}
				pixelsPerMM={pixelsPerMM}
				strideCount={strideCount}
				useDistinctStrideColors={useDistinctStrideColors}
				showStrideLabels={showStrideLabels}
				showRobot={showRobot}
				showEnvelope={showEnvelope}
			/>

			<InfoBox
				showStats={showStats}
				setShowStats={setShowStats}
				strideCount={strideCount}
				bricks={bricks}
				robot={robot}
				setRobot={setRobot}
				robotDistanceTravelled={robotDistanceTravelled}
				useDistinctStrideColors={useDistinctStrideColors}
				setUseDistinctStrideColors={setUseDistinctStrideColors}
				showStrideLabels={showStrideLabels}
				setShowStrideLabels={setShowStrideLabels}
				showRobot={showRobot}
				setShowRobot={setShowRobot}
				showEnvelope={showEnvelope}
				setShowEnvelope={setShowEnvelope}
				isEditingRobotX={isEditingRobotX}
				setIsEditingRobotX={setIsEditingRobotX}
				isEditingRobotY={isEditingRobotY}
				setIsEditingRobotY={setIsEditingRobotY}
				pattern={pattern}
				setPattern={setPattern}
				patternSelectRef={patternSelectRef}
				reset={reset}
			/>

			<div className={showBuiltToast ? "visible toast" : "toast"}>
				All bricks have been built!
			</div>
		</div >
	);
};

export default App;
