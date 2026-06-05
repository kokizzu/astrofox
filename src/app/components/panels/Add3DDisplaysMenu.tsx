import { useTranslations } from "next-intl";
import SectionAddMenu from "./SectionAddMenu";

interface Add3DDisplaysMenuProps {
	sceneId: string;
}

export default function Add3DDisplaysMenu({ sceneId }: Add3DDisplaysMenuProps) {
	const t = useTranslations("addMenu");

	const categories = [
		{
			label: t("category3d"),
			items: ["Geometry", "Tunnel", "Cubes", "Mesh Grid"],
		},
	];

	return (
		<SectionAddMenu
			sceneId={sceneId}
			entityType="displays"
			categories={categories}
			ariaLabel={t("add3dDisplay")}
		/>
	);
}
