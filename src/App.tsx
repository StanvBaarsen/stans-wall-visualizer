import React, { useEffect, useState, useRef } from "react";

// sizes in mm
const FULL_BRICK_WIDTH = 210;
const HALF_BRICK_WIDTH = 100;
const BRICK_HEIGHT = 50;
const HEAD_JOINT = 10;
const BED_JOINT = 12.5;
const COURSE_HEIGHT = BRICK_HEIGHT + BED_JOINT;
const WALL_WIDTH = 2300;
const WALL_HEIGHT = 2000;
const ENVELOPE_WIDTH = 800;
const ENVELOPE_HEIGHT = 1300;

// pixels per millimeter:
const TOTAL_WIDTH_IN_PIXELS = 525;
const PIXELS_PER_MM = TOTAL_WIDTH_IN_PIXELS / WALL_WIDTH;

interface Brick {
	x: number;
	y: number;
	type: "full" | "half";
	built: boolean;
	builtDuringStrideNr?: number;
}

function generateStretcherBond(nRows: number): Brick[] {
	const bricks: Brick[] = [];
	for (let row = 0; row < nRows; row++) {
		const isOdd = row % 2 === 1;
		let x = 0;
		let y = row * COURSE_HEIGHT;

		if (isOdd) {
			bricks.push({ type: "half", x, y, built: false });
			x += HALF_BRICK_WIDTH + HEAD_JOINT;
		}

		while (x + FULL_BRICK_WIDTH <= WALL_WIDTH) {
			bricks.push({ type: "full", x, y, built: false });
			x += FULL_BRICK_WIDTH + HEAD_JOINT;
		}
		if (x <= WALL_WIDTH - HALF_BRICK_WIDTH) {
			bricks.push({ type: "half", x, y, built: false });
			x += HALF_BRICK_WIDTH + HEAD_JOINT;
		}
	}
	return bricks;
}

function generateWall(pattern: string): Brick[] {
	const nRows = Math.floor(WALL_HEIGHT / COURSE_HEIGHT);

	const generationFunctions: { [key: string]: (nRows: number) => Brick[] } = {
		"stretcher": generateStretcherBond,
	};

	if (pattern in generationFunctions) {
		const generationFunction = generationFunctions[pattern];
		return generationFunction(nRows);
	}

	return [];
}

// source: https://medium.com/@winwardo/simple-non-repeating-colour-generation-6efc995832b8
function getDistinctColor(index: number) {
	const hue = (index * 137.508) % 360;
	return `hsl(${hue}, 70 %, 55 %)`;
}

const App: React.FC = () => {
	const [bricks, setBricks] = useState<Brick[]>([]);
	// initial robot position should have envelope's bottom-left corner at (0,0)
	const [robot, setRobot] = useState<{ x: number; y: number }>({ x: ENVELOPE_WIDTH / 2, y: ENVELOPE_HEIGHT / 2 });
	const [strideCount, setStrideCount] = useState(0);
	const [isBuildingEntireWall, setIsBuildingEntireWall] = useState(false);
	const [showStats, setShowStats] = useState(false);
	const [robotDistanceTravelled, setRobotDistanceTravelled] = useState(0);
	const [useDistinctStrideColors, setUseDistinctStrideColors] = useState(false);



	const bricksRef = useRef<Brick[]>([]);
	const robotRef = useRef(robot);
	const strideCountRef = useRef(strideCount);
	const isBuildingEntireWallRef = useRef(isBuildingEntireWall);
	useEffect(() => { bricksRef.current = bricks; }, [bricks]);
	useEffect(() => { robotRef.current = robot; }, [robot]);
	useEffect(() => { strideCountRef.current = strideCount; }, [strideCount]);
	useEffect(() => { isBuildingEntireWallRef.current = isBuildingEntireWall; }, [isBuildingEntireWall]);

	const busyRef = useRef(false);

	function brickCanBeBuilt(brick: Brick, all: Brick[]): boolean {
		if (brick.y === 0) return true;
		const leftX = brick.x;
		const rightX =
			brick.x +
			(brick.type === "full" ? FULL_BRICK_WIDTH : HALF_BRICK_WIDTH);
		const belowY = brick.y - (BRICK_HEIGHT + BED_JOINT);

		const isSupported = (xEdge: number) =>
			all.some((b) => {
				if (!b.built || b.y !== belowY) return false;
				const w = b.type === "full" ? FULL_BRICK_WIDTH : HALF_BRICK_WIDTH;
				return b.x <= xEdge && b.x + w >= xEdge;
			});

		return isSupported(leftX) && isSupported(rightX);
	}

	function fitsWithinRobotWindow(brick: Brick, r: { x: number; y: number }) {
		const brickWidth = brick.type === "full" ? FULL_BRICK_WIDTH : HALF_BRICK_WIDTH;
		return (
			brick.x >= r.x - ENVELOPE_WIDTH / 2 &&
			brick.x + brickWidth <= r.x + ENVELOPE_WIDTH / 2 &&
			brick.y >= r.y - ENVELOPE_HEIGHT / 2 &&
			brick.y + BRICK_HEIGHT <= r.y + ENVELOPE_HEIGHT / 2
		);
	}

	function getCourse(courseNumber: number): Brick[] {
		const courseY = courseNumber * COURSE_HEIGHT;
		return bricksRef.current.filter((b) => b.y === courseY);
	}

	function calculateNewRobotPosition(r: { x: number; y: number }) {
		// find the lowest completed course
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

		// the robot should move to whichever unbuilt brick in the uncompleted course is closest
		// but then, to cover more bricks, it should center its envelope over the middle of that course
		// unless that would push it out of bounds of the wall
		// or if that does not increase coverage of unbuilt bricks

		const unbuiltBricks = courseBricks.filter((b) => !b.built);

		const targetBrick = unbuiltBricks.reduce((closest, b) => {
			const brickCenterX =
				b.x +
				(b.type === "full" ? FULL_BRICK_WIDTH : HALF_BRICK_WIDTH) / 2;
			const distClosest = Math.abs(
				(closest.x +
					(closest.type === "full"
						? FULL_BRICK_WIDTH
						: HALF_BRICK_WIDTH) /
					2) -
				r.x
			);
			const distB = Math.abs(brickCenterX - r.x);
			return distB < distClosest ? b : closest;
		}, unbuiltBricks[0]);

		const targetBrickW = targetBrick.type === "full" ? FULL_BRICK_WIDTH : HALF_BRICK_WIDTH;
		const targetX = targetBrick.x + targetBrickW / 2;

		// center envelope over targetX, but keep within wall bounds
		let newX = targetX;
		if (newX - ENVELOPE_WIDTH / 2 < 0) {
			newX = ENVELOPE_WIDTH / 2;
		} else if (newX + ENVELOPE_WIDTH / 2 > WALL_WIDTH) {
			newX = WALL_WIDTH - ENVELOPE_WIDTH / 2;
		}

		let newY = course * COURSE_HEIGHT + ENVELOPE_HEIGHT / 2;
		if (newY - ENVELOPE_HEIGHT / 2 < 0) {
			newY = ENVELOPE_HEIGHT / 2;
		}
		if (newY + ENVELOPE_HEIGHT / 2 > WALL_HEIGHT) {
			newY = WALL_HEIGHT - ENVELOPE_HEIGHT / 2;
		}

		return { x: newX, y: newY };
	}

	async function buildNextBrick() {
		if (busyRef.current) return;
		busyRef.current = true;

		const all = bricksRef.current;
		const r = robotRef.current;
		const unbuilt = all.filter((b) => !b.built);
		if (!unbuilt.length) {
			busyRef.current = false;
			return;
		}

		const inWindow = unbuilt.filter((b) => fitsWithinRobotWindow(b, r));
		const buildable = inWindow.filter((b) => brickCanBeBuilt(b, all));

		if (buildable.length) {
			const next = buildable[0];
			const strideNr = strideCountRef.current + 1;
			const updated = all.map((b) =>
				b === next ? { ...b, built: true, builtDuringStrideNr: strideNr } : b
			);
			bricksRef.current = updated;
			setBricks(updated);
		} else {
			const newRobotPos = calculateNewRobotPosition(r);
			const oldRobotX = robotRef.current.x;
			const oldRobotY = robotRef.current.y;
			robotRef.current = newRobotPos;
			setRobot(newRobotPos);
			setStrideCount((c) => c + 1);

			const distance = Math.sqrt(
				Math.pow(newRobotPos.x - oldRobotX, 2) +
				Math.pow(newRobotPos.y - oldRobotY, 2)
			);
			setRobotDistanceTravelled((d) => d + distance);
		}

		await new Promise((res) => setTimeout(res, 50));
		busyRef.current = false;
	}

	const buildEntireWall = async () => {
		setIsBuildingEntireWall(true);
		while (bricksRef.current.some((b) => !b.built)) {
			await buildNextBrick();
		}
	};

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				if (e.shiftKey) {
					buildEntireWall();
				} else if (!isBuildingEntireWallRef.current) {
					buildNextBrick();
				}
			}

			if (e.key === "s" || e.key === "S") {
				setShowStats((s) => !s);
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, []);

	useEffect(() => {
		// initialize wall
		setBricks(generateWall("stretcher"));
	}, []);


	return (
		<div id="main">
			<header>
				<h1>Stan's Wall Visualizer</h1>
			</header>
			<div id="instructions">
				<p>
					Press <kbd>Enter</kbd> to build the next brick.
				</p>
				<p id="entireWallHint">(or <kbd>Shift</kbd> + <kbd>Enter</kbd> to build the entire wall!)</p>
			</div>

			<div
				id="wall"
				style={{
					width: WALL_WIDTH * PIXELS_PER_MM,
					height: WALL_HEIGHT * PIXELS_PER_MM,
					position: "relative",
				}}
			>
				{bricks.map((brick, index) => {
					let bgColour = "#fffdf3";
					let overlay = null;

					if (brick.built) {
						const strideNr = brick.builtDuringStrideNr ?? 0;

						if (useDistinctStrideColors) {
							bgColour = getDistinctColor(strideNr);
						} else {
							const strideAge = strideCount - strideNr;
							const lightness = Math.max(35, 70 - strideAge * 8);
							bgColour = `hsl(24, 80%, ${lightness}%)`;
						}

						// semi-transparent stride label overlay
						overlay = (
							<div
								style={{
									position: "absolute",
									inset: 0,
									backgroundColor: "rgba(0,0,0,0.3)",
									color: "white",
									fontSize: "10px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									opacity: 0.6,
									pointerEvents: "none",
								}}
							>
								{brick.builtDuringStrideNr}
							</div>
						);
					}

					return (
						<div
							key={index}
							className="absolute rounded-sm transition-all duration-300 box-border border border-dashed border-1"
							style={{
								width:
									(brick.type === "full" ? FULL_BRICK_WIDTH : HALF_BRICK_WIDTH) *
									PIXELS_PER_MM,
								height: BRICK_HEIGHT * PIXELS_PER_MM,
								left: brick.x * PIXELS_PER_MM,
								bottom: brick.y * PIXELS_PER_MM,
								borderColor: brick.built ? bgColour : "rgba(0,0,0,0.1)",
								backgroundColor: bgColour,
								position: "absolute",
							}}
						>
							{overlay}
						</div>
					);
				})}


				<div
					id="envelope"
					style={{
						width: ENVELOPE_WIDTH * PIXELS_PER_MM,
						height: ENVELOPE_HEIGHT * PIXELS_PER_MM,
						left: (robot.x - ENVELOPE_WIDTH / 2) * PIXELS_PER_MM,
						bottom: (robot.y - ENVELOPE_HEIGHT / 2) * PIXELS_PER_MM,
					}}
				/>

				<img
					id="robot"
					style={{
						left: robot.x * PIXELS_PER_MM,
						bottom: robot.y * PIXELS_PER_MM,
					}}
					src="/robot-icon.png"
				/>
			</div>

			<div id="infoBox">
				{showStats ? (
					<div>
						<p style={{ margin: 0, fontWeight: 600, fontSize: "16px" }}>Statistics / Settings</p>
						<p style={{ margin: 0 }}>Number of strides: {strideCount}</p>
						<p style={{ margin: 0 }}>Bricks built: {bricks.filter((b) => b.built).length} / {bricks.length}</p>
						<p style={{ margin: 0 }}>Bricks per stride: {strideCount > 0 ? (bricks.filter((b) => b.built).length / strideCount).toFixed(2) : "0"}</p>
						<p style={{ margin: 0 }}>Robot position: ({robot.x.toFixed(0)}mm, {robot.y.toFixed(0)}mm)</p>
						<p style={{ margin: 0 }}>Robot distance travelled: {(robotDistanceTravelled / 100).toFixed(2)}m</p>

						<label style={{ display: "block", marginTop: "8px" }}>
							<input
								type="checkbox"
								checked={useDistinctStrideColors}
								onChange={(e) => setUseDistinctStrideColors(e.target.checked)}
								style={{ marginRight: "6px" }}
							/>
							Use distinct colour per stride
						</label>


						<p style={{ marginTop: "12px", fontStyle: "italic", color: "#666" }}>
							Press <kbd>s</kbd> to hide stats / settings.
						</p>
					</div>
				) : (
					<div>
						<p style={{ margin: 0 }}>
							Assessment{" "}
							<a href="https://monumentalco.notion.site/SWE-TH3-Wall-visualizer-6d269ab0f1a342959a2ad02dc0b121d2" target="_blank" style={{ fontWeight: 600, textDecoration: "none" }}>
								SWE TH3: Wall Visualizer
							</a>
							{" "}for{" "}
							<a href="https://www.monumental.co" target="_blank" style={{ textDecoration: "none" }}>
								Monumental
							</a>
							{" "}by{" "}
							<a href="https://stanvanbaarsen.nl" target="_blank" style={{ color: "#0c65ea", fontWeight: 600, textDecoration: "none" }}>
								Stan van Baarsen
							</a>
							.
						</p>
						<p style={{ marginTop: "12px", fontStyle: "italic", color: "#666" }}>
							Press <kbd>s</kbd> to show stats / settings.
						</p>
					</div>
				)}
			</div>
		</div>

	);
};

export default App;