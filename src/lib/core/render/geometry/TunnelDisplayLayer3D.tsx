// @ts-nocheck
import React from "react";
import {
	AddEquation,
	BackSide,
	CatmullRomCurve3,
	Color,
	CustomBlending,
	OneFactor,
	Quaternion,
	Vector3,
	ZeroFactor,
} from "three";
import {
	getThreeBlending,
	requiresPremultipliedAlpha,
} from "../layers/TexturePlane";

const FOV = 50;

const TUNNEL_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const TUNNEL_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uTravelSpeed;
uniform float uColumns;
uniform float uRows;
uniform float uLineWidth;
uniform float uOpacity;
uniform vec3 uLineColor;
uniform vec3 uBackgroundColor;

varying vec2 vUv;

float gridLine(float value, float width) {
	float distanceToLine = min(value, 1.0 - value);
	return 1.0 - smoothstep(0.0, width, distanceToLine);
}

void main() {
	float scroll = fract(vUv.x * uRows + uTime * uTravelSpeed);
	float column = fract(vUv.y * uColumns);
	float rowMask = gridLine(scroll, uLineWidth);
	float columnMask = gridLine(column, uLineWidth);
	float grid = max(rowMask, columnMask);
	float glow = max(
		gridLine(scroll, uLineWidth * 2.5),
		gridLine(column, uLineWidth * 2.5)
	);

	vec3 color = mix(uBackgroundColor, uLineColor, glow * 0.35 + grid * 0.65);
	gl_FragColor = vec4(color, uOpacity);
}
`;

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

export function TunnelDisplayLayer3D({
	display,
	order,
	height,
	frameData,
	sceneOpacity,
	sceneBlendMode,
	sceneMask,
	sceneInverse,
}) {
	const { properties = {} } = display;
	const {
		color = "#D6ECFF",
		backgroundColor = "#02060A",
		opacity = 1,
		radius = 180,
		depth = 3200,
		curvature = 32,
		turnRate = 2.6,
		travelSpeed = 0.8,
		turnSpeed = 0.8,
		bank = 8,
		gridColumns = 28,
		gridRows = 48,
		lineWidth = 0.08,
		radialSegments = 40,
		lengthSegments = 128,
	} = properties;

	const timeRef = React.useRef(0);
	const materialRef = React.useRef(null);
	const deltaSeconds = Math.max(0, Number(frameData?.delta ?? 16.667)) / 1000;

	if (frameData?.hasUpdate) {
		timeRef.current += deltaSeconds;
	}

	const tunnelRadius = Math.max(40, Number(radius) || 0);
	const tunnelDepth = Math.max(600, Number(depth) || 0);
	const curveBend = Math.max(0, Number(curvature) || 0);
	const curveTurns = Math.max(0.1, Number(turnRate) || 0);
	const radialDetail = Math.max(8, Math.round(Number(radialSegments) || 0));
	const lengthDetail = Math.max(16, Math.round(Number(lengthSegments) || 0));
	const pathSamples = Math.max(24, Math.round(lengthDetail / 2));
	const leadDistance = Math.min(240, tunnelDepth * 0.06 + 100);
	const trailDistance = Math.min(760, tunnelDepth * 0.24 + 360);
	const curveTime = timeRef.current * Number(turnSpeed || 0);
	const cameraZ =
		Number(height || 0) > 0
			? Number(height) / 2 / Math.tan(((FOV / 2) * Math.PI) / 180)
			: 0;
	const finalOpacity = clamp(
		Number(opacity ?? 1) * Number(sceneOpacity ?? 1),
		0,
		1,
	);
	const blending = sceneMask
		? CustomBlending
		: getThreeBlending(sceneBlendMode);
	const rollRadians = ((Number(bank) || 0) * Math.PI) / 180;
	const uniforms = React.useMemo(
		() => ({
			uTime: { value: 0 },
			uTravelSpeed: { value: 0 },
			uColumns: { value: 0 },
			uRows: { value: 0 },
			uLineWidth: { value: 0 },
			uOpacity: { value: 1 },
			uLineColor: { value: new Color() },
			uBackgroundColor: { value: new Color() },
		}),
		[],
	);

	uniforms.uTime.value = timeRef.current;
	uniforms.uTravelSpeed.value = Number(travelSpeed || 0) * 1.2;
	uniforms.uColumns.value = Math.max(1, Number(gridColumns) || 1);
	uniforms.uRows.value = Math.max(1, Number(gridRows) || 1);
	uniforms.uLineWidth.value = clamp(Number(lineWidth) || 0, 0.005, 0.3);
	uniforms.uOpacity.value = finalOpacity;
	uniforms.uLineColor.value.set(sceneMask ? "#000000" : color);
	uniforms.uBackgroundColor.value.set(sceneMask ? "#000000" : backgroundColor);

	const curve = React.useMemo(() => {
		const points = [];
		const sampleStep = 10;
		const currentDistance = curveTime * 320;

		const getWorldPoint = (distance: number) => {
			const primaryAngle =
				(distance / tunnelDepth) * curveTurns * Math.PI * 2 + curveTime * 0.45;
			const secondaryAngle =
				(distance / tunnelDepth) * curveTurns * Math.PI * 4.4 -
				curveTime * 0.28;

			return new Vector3(
				Math.sin(primaryAngle) * curveBend +
					Math.sin(secondaryAngle) * curveBend * 0.3,
				Math.cos(primaryAngle * 0.82 + 0.6) * curveBend * 0.72 +
					Math.cos(secondaryAngle * 0.7 - 0.35) * curveBend * 0.22,
				-distance,
			);
		};

		const cameraPoint = getWorldPoint(currentDistance);
		const nextPoint = getWorldPoint(currentDistance + sampleStep);
		const tangent = nextPoint.clone().sub(cameraPoint).normalize();
		const right = new Vector3().crossVectors(new Vector3(0, 1, 0), tangent);
		if (right.lengthSq() < 1e-6) {
			right.set(1, 0, 0);
		}
		right.normalize();
		const up = new Vector3().crossVectors(tangent, right).normalize();
		const bankQuat = new Quaternion().setFromAxisAngle(tangent, rollRadians);
		right.applyQuaternion(bankQuat);
		up.applyQuaternion(bankQuat);

		const toLocalPoint = (point: Vector3) => {
			const relative = point.clone().sub(cameraPoint);
			return new Vector3(
				relative.dot(right),
				relative.dot(up),
				-relative.dot(tangent),
			);
		};

		for (let index = 0; index <= pathSamples; index += 1) {
			const t = index / pathSamples;
			const distance =
				currentDistance -
				trailDistance +
				t * (tunnelDepth + leadDistance + trailDistance);
			points.push(toLocalPoint(getWorldPoint(distance)));
		}

		return new CatmullRomCurve3(points);
	}, [
		curveTime,
		curveBend,
		curveTurns,
		leadDistance,
		pathSamples,
		rollRadians,
		trailDistance,
		tunnelDepth,
	]);

	return (
		<group position={[0, 0, cameraZ]} scale={[1, 1, 1]}>
			<mesh renderOrder={order} frustumCulled={false}>
				<tubeGeometry
					args={[curve, lengthDetail, tunnelRadius, radialDetail, false]}
				/>
				<shaderMaterial
					ref={materialRef}
					uniforms={uniforms}
					vertexShader={TUNNEL_VERTEX_SHADER}
					fragmentShader={TUNNEL_FRAGMENT_SHADER}
					transparent={true}
					side={BackSide}
					depthTest={true}
					depthWrite={true}
					premultipliedAlpha={requiresPremultipliedAlpha(sceneBlendMode)}
					blending={blending}
					blendEquation={sceneMask ? AddEquation : undefined}
					blendSrc={sceneMask ? ZeroFactor : undefined}
					blendDst={sceneMask ? OneFactor : undefined}
					blendEquationAlpha={sceneMask ? AddEquation : undefined}
					blendSrcAlpha={sceneMask ? OneFactor : undefined}
					blendDstAlpha={sceneMask ? ZeroFactor : undefined}
				/>
			</mesh>
		</group>
	);
}
