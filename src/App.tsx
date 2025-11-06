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

const App: React.FC = () => {
	const [bricks, setBricks] = useState<Brick[]>([]);
	const [robot, setRobot] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

	const bricksRef = useRef<Brick[]>([]);
	const robotRef = useRef(robot);
	useEffect(() => { bricksRef.current = bricks; }, [bricks]);
	useEffect(() => { robotRef.current = robot; }, [robot]);

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

	function calculateNewRobotPosition(r: { x: number; y: number }) {
		return {
			x: r.x + 100,
			y: r.y + 40
		};
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
			const updated = all.map((b) =>
				b === next ? { ...b, built: true } : b
			);
			bricksRef.current = updated;
			setBricks(updated);
		} else {
			const moved = calculateNewRobotPosition(r);
			robotRef.current = moved;
			setRobot(moved);
		}

		await new Promise((res) => setTimeout(res, 50));
		busyRef.current = false;
	}

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Enter") buildNextBrick();
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
					Assessment SWE TH3 for Monumental &mdash; by Stan van Baarsen.<br />
					November 6, 2025.
				</p>
				<p className="mt-4">
					Press <kbd>Enter</kbd> to build next brick
				</p>
			</div>

			<div
				id="wall"
				style={{
					width: WALL_WIDTH * PIXELS_PER_MM,
					height: WALL_HEIGHT * PIXELS_PER_MM,
					position: "relative",
				}}
			>
				{bricks.map((brick, index) => (
					<div
						key={index}
						className={`absolute rounded-sm transition-all duration-300 box-border ${brick.built
							? "[background-color:#ea580c] border-[#ea580c]"
							: "[background-color:#fffdf3] border border-[#ccc] border-dashed border-1"
							}`}
						style={{
							width:
								brick.type === "full"
									? FULL_BRICK_WIDTH * PIXELS_PER_MM
									: HALF_BRICK_WIDTH * PIXELS_PER_MM,
							height: BRICK_HEIGHT * PIXELS_PER_MM,
							left: brick.x * PIXELS_PER_MM,
							bottom: brick.y * PIXELS_PER_MM,
						}}
					></div>
				))}

				<div
					id="envelope"
					style={{
						width: ENVELOPE_WIDTH * PIXELS_PER_MM,
						height: ENVELOPE_HEIGHT * PIXELS_PER_MM,
						left: (robot.x - ENVELOPE_WIDTH / 2) * PIXELS_PER_MM,
						bottom: (robot.y - ENVELOPE_HEIGHT / 2) * PIXELS_PER_MM,
					}}
				/>

				<div
					id="robot"
					style={{
						left: robot.x * PIXELS_PER_MM,
						bottom: robot.y * PIXELS_PER_MM,
					}}
				>
					🤖
				</div>
			</div>
		</div>
	);
};

export default App;