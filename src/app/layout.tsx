import { fontVariables, inter } from "@/app/fonts";
import "@/app/tailwind.css";
import "@/app/styles/index.css";
import type React from "react";

export const metadata = {
	title: "Astrofox",
};

export default function RootLayout({
	children,
}: { children: React.ReactNode }) {
	const showTrackingImage = process.env.NODE_ENV === "production";

	return (
		<html lang="en">
			<body className={`${fontVariables} ${inter.className}`}>
				{showTrackingImage ? (
					<img
						src="https://cloud.umami.is/p/Umd1csk2c"
						alt=""
						aria-hidden="true"
						style={{ display: "none" }}
					/>
				) : null}
				{children}
			</body>
		</html>
	);
}
