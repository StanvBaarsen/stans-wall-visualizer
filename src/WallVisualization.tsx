import React from "react";
import {
  BRICK_HEIGHT,
  ENVELOPE_WIDTH,
  ENVELOPE_HEIGHT,
  WALL_WIDTH,
  WALL_HEIGHT,
  type Brick,
} from "./constants";

interface WallVisualizationProps {
  bricks: Brick[];
  robot: { x: number; y: number };
  pixelsPerMM: number;
  strideCount: number;
  useDistinctStrideColors: boolean;
  showStrideLabels: boolean;
  showRobot: boolean;
  showEnvelope: boolean;
}

// source: https://medium.com/@winwardo/simple-non-repeating-colour-generation-6efc995832b8
function getDistinctColor(index: number) {
  const hue = ((index + 5) * 137.508) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

export const WallVisualization: React.FC<WallVisualizationProps> = ({
  bricks,
  robot,
  pixelsPerMM,
  strideCount,
  useDistinctStrideColors,
  showStrideLabels,
  showRobot,
  showEnvelope,
}) => {
  return (
    <div
      id="wall"
      style={{
        width: WALL_WIDTH * pixelsPerMM,
        height: WALL_HEIGHT * pixelsPerMM,
        position: "relative",
      }}
    >
      {(() => {
        const allBricksBuilt = bricks.every((brick) => brick.built);

        return bricks.map((brick, index) => {
          let bgColour = "#fffdf3";

          if (brick.built) {
            const strideNr = brick.builtDuringStrideNr ?? 0;

            if (useDistinctStrideColors) {
              bgColour = getDistinctColor(strideNr);
            } else {
              const strideAge = strideCount - strideNr;
              let lightness = Math.max(35, 70 - strideAge * 8);
              if (allBricksBuilt) lightness = 50;
              bgColour = `hsl(24, 80%, ${lightness}%)`;
            }
          }

          return (
            <div
              key={index}
              className="absolute rounded-sm transition-all duration-300 box-border border border-dashed border-1"
              style={{
                width: brick.length * pixelsPerMM,
                height: BRICK_HEIGHT * pixelsPerMM,
                left: brick.x * pixelsPerMM,
                bottom: brick.y * pixelsPerMM,
                borderColor: brick.built ? bgColour : "rgba(0,0,0,0.1)",
                backgroundColor: bgColour,
                position: "absolute",
                transitionDuration: allBricksBuilt ? "2000ms" : "300ms",
              }}
            >
              {showStrideLabels && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    color: "rgba(0,0,0,0.5)",
                    fontWeight: "bold",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.6,
                  }}
                >
                  {brick.builtDuringStrideNr}
                </div>
              )}
            </div>
          );
        });
      })()}

      {showEnvelope && (
        <div
          id="envelope"
          style={{
            width: ENVELOPE_WIDTH * pixelsPerMM,
            height: ENVELOPE_HEIGHT * pixelsPerMM,
            left: (robot.x - ENVELOPE_WIDTH / 2) * pixelsPerMM,
            bottom: (robot.y - ENVELOPE_HEIGHT / 2) * pixelsPerMM,
          }}
        />
      )}

      {showRobot && (
        <img
          id="robot"
          style={{
            left: robot.x * pixelsPerMM,
            bottom: robot.y * pixelsPerMM,
          }}
          src="/robot-icon.png"
        />
      )}
    </div>
  );
};
