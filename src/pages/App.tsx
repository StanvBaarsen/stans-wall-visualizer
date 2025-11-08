import React, { useEffect, useState, useRef } from "react";
import { InfoBox } from "../components/InfoBox.tsx";
import { CreditsSign } from "../components/CreditsSign.tsx";
import { Wall } from "../components/Wall.tsx";
import { doNextBuildStep, calculateNewRobotPosition } from "../lib/robotBuildLogic.tsx";
import {
	WALL_WIDTH,
	WALL_HEIGHT,
	ENVELOPE_WIDTH,
	ENVELOPE_HEIGHT,
	type Brick,
} from "../lib/constants";
import { generateWall } from "../lib/wallGenerators.ts";


const App: React.FC = () => {
	// setup:
	const [bricks, setBricks] = useState<Brick[]>([]);
	const [pattern, setPattern] = useState("stretcher");
	const [robot, setRobot] = useState<{ x: number; y: number }>({ x: ENVELOPE_WIDTH / 2, y: ENVELOPE_HEIGHT / 2 });
	const [isBuildingEntireWall, setIsBuildingEntireWall] = useState(false);
	const [pixelsPerMM, setPixelsPerMM] = useState(0.25);
	const [showBuiltToast, setShowBuiltToast] = useState(false);

	// stats
	const [strideCount, setStrideCount] = useState(0);
	const [robotDistanceTravelled, setRobotDistanceTravelled] = useState(0);

	// settings:
	const [useDistinctStrideColors, setUseDistinctStrideColors] = useState(false);
	const [isEditingRobotX, setIsEditingRobotX] = useState(false);
	const [isEditingRobotY, setIsEditingRobotY] = useState(false);
	const [showEnvelope, setShowEnvelope] = useState(true);
	const [showInfoBox, setShowInfoBox] = useState(innerWidth > 1100);
	const [showRobot, setShowRobot] = useState(true);
	const [showStrideLabels, setShowStrideLabels] = useState(false);


	// refs to variables that might cause race conditions
	const busyRef = useRef(false); // is currently building a brick
	const bricksRef = useRef<Brick[]>([]);
	const patternRef = useRef("stretcher");
	const robotRef = useRef(robot);
	const strideCountRef = useRef(strideCount);
	const robotDistanceTravelledRef = useRef(robotDistanceTravelled);
	const isBuildingEntireWallRef = useRef(isBuildingEntireWall);
	const patternSelectRef = useRef<HTMLSelectElement | null>(null);
	useEffect(() => { bricksRef.current = bricks; }, [bricks]);
	useEffect(() => { robotRef.current = robot; }, [robot]);
	useEffect(() => { strideCountRef.current = strideCount; }, [strideCount]);
	useEffect(() => { robotDistanceTravelledRef.current = robotDistanceTravelled; }, [robotDistanceTravelled]);
	useEffect(() => { isBuildingEntireWallRef.current = isBuildingEntireWall; }, [isBuildingEntireWall]);
	useEffect(() => { patternRef.current = pattern }, [pattern])


	const reset = () => {
		setIsBuildingEntireWall(false);
		setTimeout(() => {
			const newWall = generateWall(patternRef.current);
			setBricks(newWall);
			// move robot to optimal initial position
			setRobot({ x: calculateNewRobotPosition(bricksRef, robotRef, newWall).x, y: ENVELOPE_HEIGHT / 2 })
			setStrideCount(0);
			setRobotDistanceTravelled(0);
		}, 100)
	};

	async function nextBuildStep() {
		await doNextBuildStep(busyRef, bricksRef, robotRef, setShowBuiltToast, strideCountRef, robotDistanceTravelledRef, setBricks, setRobot, setStrideCount, setRobotDistanceTravelled);
	}

	const buildEntireWall = async () => {
		setIsBuildingEntireWall(true);
		isBuildingEntireWallRef.current = true;
		while (bricksRef.current.some((b) => !b.built)) {
			if (!isBuildingEntireWallRef.current) break;

			await nextBuildStep();
		}
		setIsBuildingEntireWall(false);
	};

	// handle the keyboard shortcuts
	useEffect(() => {
		const keydownHandler = (e: KeyboardEvent) => {
			const keyboardActions: Record<string, () => void> = {
				enter: () => {
					if (!isBuildingEntireWallRef.current) {
						if (e.shiftKey) {
							buildEntireWall();
						} else {
							nextBuildStep();
						}
					}
				},
				escape: () => setIsBuildingEntireWall(false),
				c: () => setUseDistinctStrideColors((v) => !v),
				n: () => setShowStrideLabels((v) => !v),
				i: () => setShowRobot((v) => !v),
				e: () => setShowEnvelope((v) => !v),
				r: () => reset(),
				s: () => setShowInfoBox((v) => !v),
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
		// when the browser window resizes, make sure the wall still fits on the screen:
		const handleResize = () => {
			// make the wall between 300 and 600px, but no more than the window height minus a margin (240px) for the header
			let wallHeightInPx = Math.min(Math.max(innerHeight - 320, 300), 600);

			// also make sure the wall is not wider than the window width minus a margin (40px)
			wallHeightInPx = Math.min(wallHeightInPx, (innerWidth - 40) * (WALL_HEIGHT / WALL_WIDTH));

			setPixelsPerMM(wallHeightInPx / WALL_HEIGHT);
		};

		// when the user loads the page, do an initial wall resizing
		handleResize();
		window.addEventListener("resize", handleResize);

		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		reset();
	}, [pattern]);

	return (
		<>
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
							{bricks.length && bricks.every((b) => b.built) ?
								<>
									<p onClick={() => reset()} style={{ cursor: "pointer" }}>
										Press <kbd>r</kbd> to reset the wall.
									</p>
								</>
								: <>
									<p onClick={() => nextBuildStep()} style={{ cursor: "pointer" }}>
										Press <kbd>Enter</kbd> to build the next brick.
									</p>
									<p id="entireWallHint" onClick={() => buildEntireWall()} style={{ cursor: "pointer" }}>
										(or <kbd>Shift</kbd> + <kbd>Enter</kbd> to build the entire wall!)
									</p>
								</>
							}
						</>
					}
				</div >

				<Wall
					bricks={bricks}
					robot={robot}
					pixelsPerMM={pixelsPerMM}
					strideCount={strideCount}
					useDistinctStrideColors={useDistinctStrideColors}
					showStrideLabels={showStrideLabels}
					showRobot={showRobot}
					showEnvelope={showEnvelope}
				/>


				{showInfoBox ?
					<InfoBox
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
						hideInfoBox={() => setShowInfoBox(false)}
					/>
					:
					<button
						onClick={() => setShowInfoBox(true)}
						style={{
							position: "fixed",
							bottom: 32,
							right: 38,
							padding: "6px 12px",
							backgroundColor: "#eee",
							border: "1px solid #ccc",
							borderRadius: "4px",
							cursor: "pointer",
						}}
					>
						Show <span style={{ textDecoration: "underline" }}>s</span>ettings
					</button>
				}

				<CreditsSign />

				<div className={showBuiltToast ? "visible toast" : "toast"}>
					All bricks have been built!
				</div>
			</div >
			<img
				className="crane"
				src="/crane.png"
				alt="Construction crane watching over the wall"
				loading="lazy"
			/>
		</>
	);
};

export default App;
