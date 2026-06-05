import useError, { clearError } from "@/app/actions/error";
import Dialog from "@/app/components/window/Dialog";
import { Warning } from "@/app/icons";
import { useTranslations } from "next-intl";
import React from "react";

interface ErrorDialogProps {
	onClose?: () => void;
}

export default function ErrorDialog({ onClose }: ErrorDialogProps) {
	const tc = useTranslations("common");
	const message = useError((state) => state.message);

	function handleConfirm() {
		clearError();
		onClose?.();
	}

	return (
		<Dialog
			icon={Warning}
			message={message ?? undefined}
			buttons={[tc("ok")]}
			onConfirm={handleConfirm}
		/>
	);
}
