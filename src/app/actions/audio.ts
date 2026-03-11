// @ts-nocheck
import { analyzer, api, logger, player } from "@/app/global";
import { loadAudioData } from "@/lib/utils/audio";
import { trimChars } from "@/lib/utils/string";
import create from "zustand";
import appStore from "./app";
import { raiseError } from "./error";

export const initialState = {
	file: "",
	source: null,
	duration: 0,
	loading: false,
	tags: null,
	error: null,
};

const audioStore = create(() => ({
	...initialState,
}));

const AUDIO_FILE_FILTERS = [
	{
		name: "audio files",
		extensions: ["aac", "flac", "mp3", "m4a", "opus", "ogg", "wav"],
	},
];

export async function inspectAudioFile(file: File) {
	const data = await api.readAudioFile(file);
	const audio = await loadAudioData(data);

	return {
		file,
		name: file.name,
		duration: audio.getDuration(),
		buffer: audio.buffer,
	};
}

export async function chooseAudioFile() {
	const { files, canceled } = await api.showOpenDialog({
		filters: AUDIO_FILE_FILTERS,
	});

	if (canceled || !files?.length) {
		return null;
	}

	return files[0];
}

export async function loadAudioFile(file: File | string, play?: boolean) {
	audioStore.setState({ loading: true });

	player.stop();

	// Yield one frame so loading UI can paint before heavy audio decode work begins.
	await new Promise((resolve) => {
		if (typeof window !== "undefined" && window.requestAnimationFrame) {
			window.requestAnimationFrame(() => resolve());
			return;
		}

		setTimeout(() => resolve(), 0);
	});

	const name = file?.name || file;

	logger.time("audio-file-load");

	try {
		const data = await api.readAudioFile(file);
		const audio = await loadAudioData(data);
		const duration = audio.getDuration();

		player.load(audio);
		audio.addNode(analyzer.analyzer);

		const shouldPlay = play ?? true;

		if (shouldPlay) {
			player.play();
		}

		logger.timeEnd("audio-file-load", "Audio file loaded:", name);

		const tags = await api.loadAudioTags(file);

		if (tags) {
			const { artist, title } = tags;

			appStore.setState({ statusText: trimChars(`${artist} - ${title}`) });
		} else {
			appStore.setState({ statusText: trimChars(name) });
		}

		audioStore.setState({
			file: name,
			source: file instanceof File ? file : null,
			duration,
			tags,
			loading: false,
		});
	} catch (error) {
		raiseError("Invalid audio file.", error);

		audioStore.setState({ loading: false });
	}
}

export async function openAudioFile(play?: boolean) {
	const { files, canceled } = await api.showOpenDialog({
		filters: AUDIO_FILE_FILTERS,
	});

	if (!canceled && files && files.length) {
		const shouldPlay = play ?? true;

		await loadAudioFile(files[0], shouldPlay);
	}
}

export default audioStore;
