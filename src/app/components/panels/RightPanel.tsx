import ControlsPanel from "@/app/components/panels/ControlsPanel";
import PanelHeader from "@/app/components/panels/PanelHeader";
import { useTranslations } from "next-intl";
import React from "react";

export default function RightPanel() {
	const t = useTranslations("panels");

	return (
		<div className="flex flex-col w-90 shrink-0 overflow-hidden border-l">
			<PanelHeader title={t("controls")} />
			<ControlsPanel />
		</div>
	);
}
