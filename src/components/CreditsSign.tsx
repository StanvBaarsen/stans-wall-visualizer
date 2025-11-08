
export const CreditsSign = () => {
	return (
		<div id="creditsSign" style={{ position: "fixed" }}>
			<div style={{ position: "relative" }}>
				<img src="sign.png" alt="Credits Sign" style={{ height: 160, width: 250 }} />
				<span style={{ position: "absolute", top: "34px" }}>
					<a href="https://monumentalco.notion.site/SWE-TH3-Wall-visualizer-6d269ab0f1a342959a2ad02dc0b121d2" target="_blank"><b>SWE TH3: Wall Visualizer</b></a>
				</span>
				<span style={{ position: "absolute", top: "71px" }}>
					Assessment for{" "}
					<a href="https://www.monumental.co" target="_blank">
						Monumental
					</a>
				</span>
				<span style={{ position: "absolute", top: "107px" }}>
					By{" "}<a href="https://www.stanvanbaarsen.nl" target="_blank">
						Stan van Baarsen
					</a>
				</span>
			</div>
		</div>
	);
};
