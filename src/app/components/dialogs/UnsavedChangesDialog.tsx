import useProject, {
	newProject,
	openProjectBrowser,
	saveProject,
} from "@/app/actions/project";
import Dialog from "@/app/components/window/Dialog";
import { useTranslations } from "next-intl";
import React from "react";

interface UnsavedChangesDialogProps {
	action?: string;
	onClose?: () => void;
}

export default function UnsavedChangesDialog({
	action,
	onClose,
}: UnsavedChangesDialogProps) {
	const t = useTranslations("unsavedChanges");
	const tc = useTranslations("common");
	const project = useProject((state) => state);

	async function handleAction(actionType: string) {
		if (actionType === "new-project") {
			await newProject();
		} else if (actionType === "open-project") {
			await openProjectBrowser();
		}
	}

	async function closeThenRunAction() {
		onClose?.();
		await Promise.resolve();
		if (action) {
			await handleAction(action);
		}
	}

	async function handleConfirm(button: string) {
		if (button === tc("yes")) {
			const saved = await saveProject(project.projectName);

			if (saved) {
				await closeThenRunAction();
			}
		} else if (button === tc("no")) {
			await closeThenRunAction();
		} else {
			onClose?.();
		}
	}

	return (
		<Dialog
			message={t("message")}
			buttons={[tc("yes"), tc("no"), tc("cancel")]}
			onConfirm={handleConfirm}
		/>
	);
}
