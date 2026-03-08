// @ts-nocheck
import { Pass } from "postprocessing";
import { Vector2 } from "three";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export class PPUnrealBloomPass extends Pass {
	constructor({
		width = 1,
		height = 1,
		exposure = 1,
		strength = 1.5,
		radius = 0,
		threshold = 0,
	} = {}) {
		super("PPUnrealBloomPass");

		this.unrealBloomPass = new UnrealBloomPass(
			new Vector2(
				Math.max(1, Math.floor(Number(width || 1))),
				Math.max(1, Math.floor(Number(height || 1))),
			),
			0,
			Number(radius ?? 0),
			Number(threshold ?? 0),
		);
		this.updateOptions({
			exposure,
			strength,
			radius,
			threshold,
		});

		// UnrealBloomPass composites into the read buffer and doesn't require swap.
		this.needsSwap = false;
	}

	updateOptions({
		exposure = 1,
		strength = 1.5,
		radius = 0,
		threshold = 0,
	} = {}) {
		const exposureScale = Math.max(0, Number(exposure ?? 1)) ** 4;
		this.unrealBloomPass.strength = Number(strength ?? 1.5) * exposureScale;
		this.unrealBloomPass.radius = Number(radius ?? 0);
		this.unrealBloomPass.threshold = Number(threshold ?? 0);
	}

	render(renderer, inputBuffer, outputBuffer, deltaTime, stencilTest) {
		this.unrealBloomPass.render(
			renderer,
			outputBuffer,
			inputBuffer,
			deltaTime,
			stencilTest,
		);
	}

	setSize(width, height) {
		this.unrealBloomPass.setSize(width, height);
	}

	dispose() {
		super.dispose();
		this.unrealBloomPass?.dispose();
	}
}
