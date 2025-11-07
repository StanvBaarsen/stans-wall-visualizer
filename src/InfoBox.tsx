import React from "react";
import { PATTERN_MAP } from "./wallGenerators";

interface InfoBoxProps {
	showStats: boolean;
	setShowStats: (show: boolean) => void;
	strideCount: number;
	bricks: Array<{ built: boolean }>;
	robot: { x: number; y: number };
	setRobot: (robot: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
	robotDistanceTravelled: number;
	useDistinctStrideColors: boolean;
	setUseDistinctStrideColors: (use: boolean) => void;
	showStrideLabels: boolean;
	setShowStrideLabels: (show: boolean) => void;
	showRobot: boolean;
	setShowRobot: (show: boolean) => void;
	showEnvelope: boolean;
	setShowEnvelope: (show: boolean) => void;
	isEditingRobotX: boolean;
	setIsEditingRobotX: (editing: boolean) => void;
	isEditingRobotY: boolean;
	setIsEditingRobotY: (editing: boolean) => void;
	pattern: string;
	setPattern: (pattern: string) => void;
	patternSelectRef: React.RefObject<HTMLSelectElement | null>;
	reset: () => void;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
	showStats,
	setShowStats,
	strideCount,
	bricks,
	robot,
	setRobot,
	robotDistanceTravelled,
	useDistinctStrideColors,
	setUseDistinctStrideColors,
	showStrideLabels,
	setShowStrideLabels,
	showRobot,
	setShowRobot,
	showEnvelope,
	setShowEnvelope,
	isEditingRobotX,
	setIsEditingRobotX,
	isEditingRobotY,
	setIsEditingRobotY,
	pattern,
	setPattern,
	patternSelectRef,
	reset,
}) => {
	return (
		<div id="infoBox">
			{showStats ? (
				<div>
					<p style={{ margin: 0, fontWeight: 600, fontSize: "22px" }}>
						Statistics & Settings
					</p>
					<p style={{ margin: 0 }}>
						<b>Number of strides:</b> {strideCount}
					</p>
					<p style={{ margin: 0 }}>
						<b>Bricks built:</b> {bricks.filter((b) => b.built).length} / {bricks.length}
					</p>
					<p style={{ margin: 0 }}>
						<b>Bricks per stride:</b> {strideCount > 0 ? (bricks.filter((b) => b.built).length / strideCount).toFixed(2) : "0"}
					</p>
					<p style={{ margin: 0 }}>
						<b>Robot position:</b>{" "}
						({isEditingRobotX ? <>
							<input
								type="number"
								value={robot.x}
								onChange={(e) => setRobot((r) => ({ ...r, x: parseFloat(e.target.value) }))}
								onBlur={() => setIsEditingRobotX(false)}
								style={{ width: "32px" }}
							/>mm
						</> : <>
							<span
								onClick={() => setIsEditingRobotX(true)}
								style={{ textDecoration: "underline", cursor: "pointer" }}
							>
								{robot.x.toFixed(0)}
							</span>mm
						</>}
						,
						{isEditingRobotY ? <>
							<input
								type="number"
								value={robot.y.toFixed(0)}
								onChange={(e) => setRobot((r) => ({ ...r, y: parseFloat(e.target.value) }))}
								onBlur={() => setIsEditingRobotY(false)}
								style={{ width: "32px", marginLeft: "6px" }}
							/>mm
						</> : <>
							<span
								onClick={() => setIsEditingRobotY(true)}
								style={{ textDecoration: "underline", cursor: "pointer", marginLeft: "6px" }}
							>
								{robot.y.toFixed(0)}
							</span>mm
						</>})
					</p>
					<p style={{ margin: 0 }}>
						<b>Robot distance travelled:</b> {(robotDistanceTravelled / 100).toFixed(2)}m
					</p>

					<label style={{ display: "block", marginTop: "8px" }}>
						<input
							type="checkbox"
							checked={useDistinctStrideColors}
							onChange={(e) => setUseDistinctStrideColors(e.target.checked)}
							style={{ marginRight: "6px" }}
						/>
						Use distinct <span style={{ textDecoration: "underline" }}>c</span>olours per stride
					</label>

					<label style={{ display: "block", marginTop: "4px" }}>
						<input
							type="checkbox"
							checked={showStrideLabels}
							onChange={(e) => setShowStrideLabels(e.target.checked)}
							style={{ marginRight: "6px" }}
						/>
						Show stride <span style={{ textDecoration: "underline" }}>n</span>umbers on bricks
					</label>

					<label style={{ display: "block", marginTop: "4px" }}>
						<input
							type="checkbox"
							checked={showRobot}
							onChange={(e) => setShowRobot(e.target.checked)}
							style={{ marginRight: "6px" }}
						/>
						Show robot <span style={{ textDecoration: "underline" }}>i</span>con
					</label>

					<label style={{ display: "block", marginTop: "4px" }}>
						<input
							type="checkbox"
							checked={showEnvelope}
							onChange={(e) => setShowEnvelope(e.target.checked)}
							style={{ marginRight: "6px" }}
						/>
						Show robot <span style={{ textDecoration: "underline" }}>e</span>nvelope
					</label>

					<label style={{ display: "block", marginTop: "8px" }}>
						<b><span style={{ textDecoration: "underline" }}>P</span>attern:</b>
						<select
							ref={patternSelectRef}
							value={pattern}
							onChange={(e) => {
								setPattern(e.target.value)
							}}
							style={{ marginLeft: "6px" }}
						>
							{Object.entries(PATTERN_MAP).map(([key, value]) => (
								<option key={key} value={key}>
									{value.displayName}
								</option>
							))}
						</select>
					</label>

					<button
						onClick={() => reset()}
						style={{
							marginTop: "8px",
							padding: "6px 12px",
							backgroundColor: "#eee",
							border: "1px solid #ccc",
							borderRadius: "4px",
							cursor: "pointer",
						}}
					>
						<span style={{ textDecoration: "underline" }}>R</span>eset everything
					</button>

					<p
						onClick={() => setShowStats(false)}
						style={{ marginTop: "40px", fontStyle: "italic", color: "#666", cursor: "pointer" }}
					>
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
					<p
						onClick={() => setShowStats(true)}
						style={{ marginTop: "12px", fontStyle: "italic", color: "#666", cursor: "pointer" }}
					>
						Press <kbd>s</kbd> to show stats / settings.
					</p>
				</div>
			)}
		</div>
	);
};
