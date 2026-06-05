import { useTranslations } from "next-intl";
import SectionAddMenu from "./SectionAddMenu";

interface AddEffectsMenuProps {
	sceneId: string;
}

export default function AddEffectsMenu({ sceneId }: AddEffectsMenuProps) {
	const t = useTranslations("addMenu");

	const categories = [
		{
			label: t("categoryColor"),
			items: ["Color"],
		},
		{
			label: t("categoryBlurFocus"),
			items: ["Blur", "Bloom", "Depth of Field", "Tilt Shift"],
		},
		{
			label: t("categoryDistortion"),
			items: ["Distortion", "Glitch", "Kaleidoscope", "Mirror", "RGB Shift"],
		},
		{
			label: t("categoryPattern"),
			items: [
				"ASCII",
				"Color Halftone",
				"Dot Screen",
				"LED",
				"Pixelate",
				"Scanline",
			],
		},
		{
			label: t("categoryStylize"),
			items: ["Noise", "Perlin Noise", "Vignette"],
		},
	];

	return (
		<SectionAddMenu
			sceneId={sceneId}
			entityType="effects"
			categories={categories}
			ariaLabel={t("addEffect")}
		/>
	);
}
