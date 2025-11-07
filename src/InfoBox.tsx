import React from "react";
import { PATTERN_MAP } from "./wallGenerators";

interface InfoBoxProps {
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
	hideInfoBox: () => void;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
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
	hideInfoBox
}) => {
	return (
		<div id="infoBox">
			<p style={{ margin: 0, fontWeight: 600, fontSize: "22px" }}>
				Settings & Stats
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
				onClick={reset}
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

			<button
				onClick={hideInfoBox}
				style={{
					padding: "6px 12px",
					backgroundColor: "#eee",
					border: "1px solid #ccc",
					borderRadius: "4px",
					cursor: "pointer",
				}}
			>
				Hide <span style={{ textDecoration: "underline" }}>s</span>ettings
			</button>
		</div>
	)
};
