// @ts-nocheck
import { useFrame } from "@react-three/fiber";
import React from "react";

const DEFAULT_LIGHT_DISTANCE = 700;

const STUDIO_LIGHTING = {
	keyPosition: [-0.42, 1.4, 0.58],
	fillPosition: [0.8, 0.52, 0.72],
	rimPosition: [-0.78, 0.38, -0.88],
	key: 1,
	fill: 1,
	rim: 1,
};
const PREVIEW_LIGHT_DISTANCE = 520;
const PREVIEW_AMBIENT_INTENSITY = 0.6;
const PREVIEW_KEY_INTENSITY = 1.1;

function scalePosition(position: number[], distance: number) {
	return position.map((value) => value * distance);
}

function getDistanceIntensityScale(distance: number) {
	const normalizedDistance = Math.max(
		50,
		Number(distance) || DEFAULT_LIGHT_DISTANCE,
	);

	return Math.max(
		0.4,
		Math.min(3, Math.sqrt(DEFAULT_LIGHT_DISTANCE / normalizedDistance)),
	);
}

function setVectorPosition(light, position: number[]) {
	if (!light) {
		return;
	}

	const [x, y, z] = position;

	if (
		light.position.x !== x ||
		light.position.y !== y ||
		light.position.z !== z
	) {
		light.position.set(x, y, z);
	}
}

function setLightColor(light, color: string) {
	if (!light || !color) {
		return;
	}

	if (light.color.getStyle() !== color) {
		light.color.set(color);
	}
}

function setLightIntensity(light, intensity: number) {
	if (!light) {
		return;
	}

	if (light.intensity !== intensity) {
		light.intensity = intensity;
	}
}

function setCastShadow(light, castShadow: boolean) {
	if (!light) {
		return;
	}

	if (light.castShadow !== castShadow) {
		light.castShadow = castShadow;
	}
}

function syncDirectionalShadow(
	light,
	distance: number,
	width: number,
	height: number,
) {
	if (!light?.shadow?.camera) {
		return;
	}

	const viewportWidth = Math.max(1, Number(width) || 1);
	const viewportHeight = Math.max(1, Number(height) || 1);
	const shadowSpanX = Math.max(viewportWidth * 0.85, distance * 0.8);
	const shadowSpanY = Math.max(viewportHeight * 0.85, distance * 0.8);
	const shadowCamera = light.shadow.camera;
	const nextFar = Math.max(distance * 4, 4000);
	let needsProjectionUpdate = false;

	if (shadowCamera.near !== 1) {
		shadowCamera.near = 1;
		needsProjectionUpdate = true;
	}

	if (shadowCamera.far !== nextFar) {
		shadowCamera.far = nextFar;
		needsProjectionUpdate = true;
	}

	if (shadowCamera.left !== -shadowSpanX) {
		shadowCamera.left = -shadowSpanX;
		needsProjectionUpdate = true;
	}

	if (shadowCamera.right !== shadowSpanX) {
		shadowCamera.right = shadowSpanX;
		needsProjectionUpdate = true;
	}

	if (shadowCamera.top !== shadowSpanY) {
		shadowCamera.top = shadowSpanY;
		needsProjectionUpdate = true;
	}

	if (shadowCamera.bottom !== -shadowSpanY) {
		shadowCamera.bottom = -shadowSpanY;
		needsProjectionUpdate = true;
	}

	if (needsProjectionUpdate) {
		shadowCamera.updateProjectionMatrix();
	}
}

function SceneLights3DImpl({ sceneProperties = {}, width, height }) {
	const previewAmbientRef = React.useRef(null);
	const previewKeyRef = React.useRef(null);
	const keyLightRef = React.useRef(null);
	const fillLightRef = React.useRef(null);
	const rimLightRef = React.useRef(null);

	useFrame(() => {
		const {
			lighting = false,
			keyLightIntensity = 2.2,
			fillLightIntensity = 0.75,
			rimLightIntensity = 0.35,
			keyLightDistance,
			fillLightDistance,
			rimLightDistance,
			lightDistance = DEFAULT_LIGHT_DISTANCE,
			lightColor = "#FFFFFF",
			fillLightColor = "#FFFFFF",
			rimLightColor = "#F3F1FF",
			shadows = true,
		} = sceneProperties;

		if (!lighting) {
			setLightIntensity(previewAmbientRef.current, PREVIEW_AMBIENT_INTENSITY);
			setVectorPosition(
				previewKeyRef.current,
				scalePosition(STUDIO_LIGHTING.keyPosition, PREVIEW_LIGHT_DISTANCE),
			);
			setLightIntensity(previewKeyRef.current, PREVIEW_KEY_INTENSITY);
			setLightColor(previewKeyRef.current, "#FFFFFF");
			setCastShadow(previewKeyRef.current, false);
			setLightIntensity(keyLightRef.current, 0);
			setLightIntensity(fillLightRef.current, 0);
			setLightIntensity(rimLightRef.current, 0);
			setCastShadow(keyLightRef.current, false);
			return;
		}

		setLightIntensity(previewAmbientRef.current, 0);
		setLightIntensity(previewKeyRef.current, 0);
		setCastShadow(previewKeyRef.current, false);

		const resolvedKeyDistance = Math.max(
			50,
			Number(keyLightDistance ?? lightDistance) || 50,
		);
		const resolvedFillDistance = Math.max(
			50,
			Number(fillLightDistance ?? lightDistance) || 50,
		);
		const resolvedRimDistance = Math.max(
			50,
			Number(rimLightDistance ?? lightDistance) || 50,
		);

		setVectorPosition(
			keyLightRef.current,
			scalePosition(STUDIO_LIGHTING.keyPosition, resolvedKeyDistance),
		);
		setLightIntensity(
			keyLightRef.current,
			Math.max(0, Number(keyLightIntensity) || 0) *
				STUDIO_LIGHTING.key *
				getDistanceIntensityScale(resolvedKeyDistance),
		);
		setLightColor(keyLightRef.current, String(lightColor || "#FFFFFF"));
		setCastShadow(keyLightRef.current, Boolean(shadows));
		syncDirectionalShadow(
			keyLightRef.current,
			resolvedKeyDistance,
			width,
			height,
		);

		setVectorPosition(
			fillLightRef.current,
			scalePosition(STUDIO_LIGHTING.fillPosition, resolvedFillDistance),
		);
		setLightIntensity(
			fillLightRef.current,
			Math.max(0, Number(fillLightIntensity) || 0) *
				STUDIO_LIGHTING.fill *
				getDistanceIntensityScale(resolvedFillDistance),
		);
		setLightColor(fillLightRef.current, String(fillLightColor || "#FFFFFF"));

		setVectorPosition(
			rimLightRef.current,
			scalePosition(STUDIO_LIGHTING.rimPosition, resolvedRimDistance),
		);
		setLightIntensity(
			rimLightRef.current,
			Math.max(0, Number(rimLightIntensity) || 0) *
				STUDIO_LIGHTING.rim *
				getDistanceIntensityScale(resolvedRimDistance),
		);
		setLightColor(rimLightRef.current, String(rimLightColor || "#F3F1FF"));
	});

	return (
		<>
			<ambientLight ref={previewAmbientRef} />
			<directionalLight ref={previewKeyRef} />
			<directionalLight
				ref={keyLightRef}
				shadow-mapSize-width={2048}
				shadow-mapSize-height={2048}
				shadow-bias={-0.00035}
				shadow-normalBias={0.02}
			/>
			<pointLight ref={fillLightRef} decay={0} />
			<pointLight ref={rimLightRef} decay={0} />
		</>
	);
}

export const SceneLights3D = React.memo(SceneLights3DImpl);
