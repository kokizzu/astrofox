import {
	type FileHandleLike,
	chooseVideoSaveLocation,
	clearVideoExportSegment,
	setVideoExportSegment,
	startVideoRecording,
} from "@/app/actions/app";
import { chooseAudioFile, inspectAudioFile } from "@/app/actions/audio";
import { raiseError } from "@/app/actions/error";
import TimeInput from "@/app/components/inputs/TimeInput";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { formatSeekTime } from "@/lib/utils/format";
import React, { useEffect, useRef, useState } from "react";

type SaveVideoDialogProps = {
	onClose: () => void;
	fileHandle?: FileHandleLike | null;
	filePath?: string;
	defaultPath?: string;
	extension?: string;
	audioSource?: File | null;
	audioFileName?: string;
	totalDuration: number;
	startTime?: number;
	endTime?: number;
	includeAudio?: boolean;
};

export default function SaveVideoDialog({
	onClose,
	fileHandle: initialFileHandle = null,
	filePath: initialFilePath = "",
	defaultPath: initialDefaultPath = "",
	extension = "webm",
	audioSource: initialAudioSource = null,
	audioFileName: initialAudioFileName = "",
	totalDuration: initialTotalDuration,
	startTime = 0,
	endTime = initialTotalDuration,
	includeAudio = true,
}: SaveVideoDialogProps) {
	const [fileHandle, setFileHandle] = useState(initialFileHandle);
	const [filePath, setFilePath] = useState(initialFilePath);
	const [audioSource, setAudioSource] = useState<File | null>(
		initialAudioSource,
	);
	const [audioFileName, setAudioFileName] = useState(initialAudioFileName);
	const [totalDuration, setTotalDuration] = useState(initialTotalDuration);
	const [selectedStartTime, setSelectedStartTime] = useState(startTime);
	const [selectedEndTime, setSelectedEndTime] = useState(endTime);
	const [shouldIncludeAudio, setShouldIncludeAudio] = useState(includeAudio);
	const [validationMessage, setValidationMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isChoosingLocation, setIsChoosingLocation] = useState(false);
	const [isChoosingAudio, setIsChoosingAudio] = useState(false);
	const keepSegmentOverlayRef = useRef(false);

	useEffect(() => {
		setVideoExportSegment(selectedStartTime, selectedEndTime, totalDuration);
	}, [selectedEndTime, selectedStartTime, totalDuration]);

	useEffect(() => {
		return () => {
			if (!keepSegmentOverlayRef.current) {
				clearVideoExportSegment();
			}
		};
	}, []);

	async function handleChooseAudio() {
		setIsChoosingAudio(true);

		try {
			const file = await chooseAudioFile();

			if (!file) {
				return;
			}

			const audio = await inspectAudioFile(file);
			setAudioSource(audio.file);
			setAudioFileName(audio.name);
			setTotalDuration(audio.duration);
			setSelectedStartTime(0);
			setSelectedEndTime(audio.duration);
			setValidationMessage("");
		} catch (error) {
			raiseError("Failed to choose an audio file.", error);
		} finally {
			setIsChoosingAudio(false);
		}
	}

	async function handleChooseLocation() {
		setIsChoosingLocation(true);

		try {
			const selection = await chooseVideoSaveLocation(filePath, extension);

			if (!selection.canceled) {
				setFileHandle(selection.fileHandle || null);
				setFilePath(selection.filePath || selection.defaultPath);
			}
		} catch (error) {
			raiseError("Failed to choose a video save location.", error);
		} finally {
			setIsChoosingLocation(false);
		}
	}

	function handleCancel() {
		if (isSubmitting) {
			return;
		}

		keepSegmentOverlayRef.current = false;
		onClose();
	}

	async function handleSave() {
		if (!audioFileName) {
			setValidationMessage("Choose an audio file before starting the export.");
			return;
		}

		if (!filePath && !fileHandle?.name) {
			setValidationMessage(
				"Choose a save location before starting the export.",
			);
			return;
		}

		if (selectedEndTime <= selectedStartTime) {
			setValidationMessage("End time must be later than start time.");
			return;
		}

		setValidationMessage("");
		setIsSubmitting(true);

		try {
			const started = await startVideoRecording({
				fileHandle,
				filePath,
				defaultPath: initialDefaultPath,
				startTime: selectedStartTime,
				endTime: selectedEndTime,
				includeAudio: shouldIncludeAudio,
				audioSource,
			});

			if (started) {
				keepSegmentOverlayRef.current = true;
				onClose();
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="flex w-[560px] max-w-full flex-col">
			<div className="flex max-h-[60vh] flex-col gap-5 overflow-auto px-4 py-4">
				<section className="space-y-2">
					<div className="flex items-center justify-between gap-3">
						<h3 className="text-sm font-medium text-neutral-100">
							Audio source
						</h3>
						<Button
							variant="outline"
							size="sm"
							disabled={isSubmitting || isChoosingAudio}
							onClick={handleChooseAudio}
						>
							{isChoosingAudio ? "Choosing..." : "Choose"}
						</Button>
					</div>
					<input
						type="text"
						readOnly
						value={audioFileName}
						placeholder="No audio file selected"
						className="w-full rounded border border-border-input bg-neutral-900 px-3 py-2 font-mono text-xs text-neutral-300 outline-none placeholder:text-neutral-500"
					/>
				</section>

				<section className="space-y-2">
					<div className="flex items-center justify-between gap-3">
						<h3 className="text-sm font-medium text-neutral-100">
							Save location
						</h3>
						<Button
							variant="outline"
							size="sm"
							disabled={isSubmitting || isChoosingLocation}
							onClick={handleChooseLocation}
						>
							{isChoosingLocation ? "Choosing..." : "Choose"}
						</Button>
					</div>
					<input
						type="text"
						readOnly
						value={filePath}
						className="w-full rounded border border-border-input bg-neutral-900 px-3 py-2 font-mono text-xs text-neutral-300 outline-none"
					/>
				</section>

				<section className="space-y-3">
					<h3 className="text-sm font-medium text-neutral-100">
						Time duration
					</h3>
					<div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
						<div className="flex flex-col gap-3.5">
							<label
								htmlFor="video-export-start-time"
								className="block text-xs uppercase tracking-wide text-neutral-400"
							>
								Start
							</label>
							<TimeInput
								name="startTime"
								value={selectedStartTime}
								min={0}
								max={totalDuration}
								width="100%"
								disabled={totalDuration <= 0}
								onChange={(_name, value) => setSelectedStartTime(value)}
							/>
						</div>
						<div className="flex flex-col gap-3.5">
							<label
								htmlFor="video-export-end-time"
								className="block text-xs uppercase tracking-wide text-neutral-400"
							>
								End
							</label>
							<TimeInput
								name="endTime"
								value={selectedEndTime}
								min={0}
								max={totalDuration}
								width="100%"
								disabled={totalDuration <= 0}
								onChange={(_name, value) => setSelectedEndTime(value)}
							/>
						</div>
					</div>
				</section>

				<section className="space-y-2">
					<div className="flex items-center justify-between gap-4 py-1">
						<label
							htmlFor="video-export-include-audio"
							className="text-sm text-neutral-100"
						>
							Include audio
						</label>
						<Switch
							id="video-export-include-audio"
							checked={shouldIncludeAudio}
							disabled={isSubmitting}
							onCheckedChange={setShouldIncludeAudio}
						/>
					</div>
				</section>

				{validationMessage ? (
					<div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
						{validationMessage}
					</div>
				) : null}
			</div>
			<div className="shrink-0 border-t border-neutral-700 bg-neutral-800 px-4 py-3">
				<DialogFooter className="justify-end sm:justify-end">
					<Button
						variant="default"
						size="sm"
						disabled={isSubmitting || isChoosingLocation}
						onClick={handleSave}
					>
						{isSubmitting ? "Starting..." : "Save video"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={isSubmitting}
						onClick={handleCancel}
					>
						Cancel
					</Button>
				</DialogFooter>
			</div>
		</div>
	);
}
