// @ts-nocheck
import { Effect, EffectAttribute } from "postprocessing";
import { Uniform, Vector2 } from "three";

const fragmentShader = `
#define MAX_ITERATIONS 100

uniform float blur;
uniform float taper;
uniform vec2 start;
uniform vec2 end;
uniform vec2 direction;
uniform int samples;

float random(vec3 scale, float seed) {
	return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	vec4 color = vec4(0.0);
	float total = 0.0;
	vec2 startPixel = vec2(start.x * resolution.x, start.y * resolution.y);
	vec2 endPixel = vec2(end.x * resolution.x, end.y * resolution.y);
	float fSamples = float(samples);
	float halfSamples = fSamples / 2.0;

	float maxScreenDistance = distance(vec2(0.0), resolution);
	float gradientRadius = max(taper * maxScreenDistance, 0.0001);
	float blurRadius = blur * (maxScreenDistance / 16.0);

	float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);
	vec2 normal = normalize(vec2(startPixel.y - endPixel.y, endPixel.x - startPixel.x));
	vec2 blurDirection = normalize(direction);
	float radius = smoothstep(
		0.0,
		1.0,
		abs(dot(uv * resolution - startPixel, normal)) / gradientRadius
	) * blurRadius;

	#pragma unroll_loop_start
	for (int i = 0; i <= MAX_ITERATIONS; i++) {
		if (i >= samples) {
			break;
		}

		float fI = float(i);
		float sampleIndex = -halfSamples + fI;
		float percent = (sampleIndex + offset - 0.5) / max(halfSamples, 0.0001);
		float weight = 1.0 - abs(percent);
		vec4 sampleColor = texture2D(
			inputBuffer,
			uv + blurDirection / resolution * percent * radius
		);
		sampleColor.rgb *= sampleColor.a;
		color += sampleColor * weight;
		total += weight;
	}
	#pragma unroll_loop_end

	outputColor = color / max(total, 0.00001);
	outputColor.rgb /= outputColor.a + 0.00001;
}
`;

export class PPTiltShiftEffect extends Effect {
	constructor({
		blur = 0.15,
		taper = 0.5,
		start = [0.5, 0.0],
		end = [0.5, 1.0],
		samples = 10,
		direction = [1, 1],
	} = {}) {
		super("PPTiltShiftEffect", fragmentShader, {
			attributes: EffectAttribute.CONVOLUTION,
			uniforms: new Map([
				["blur", new Uniform(blur)],
				["taper", new Uniform(taper)],
				["start", new Uniform(new Vector2(...start))],
				["end", new Uniform(new Vector2(...end))],
				["samples", new Uniform(samples)],
				["direction", new Uniform(new Vector2(...direction))],
			]),
		});
	}
}
