import { fontVariables, inter } from "@/app/fonts";
import "@/app/tailwind.css";
import "@/app/styles/index.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type React from "react";

export const metadata = {
	title: "Astrofox",
};

export default async function RootLayout({
	children,
}: { children: React.ReactNode }) {
	const showTrackingImage = process.env.NODE_ENV === "production";
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale}>
			<body className={`${fontVariables} ${inter.className}`}>
				{showTrackingImage ? (
					<img
						src="https://cloud.umami.is/p/Umd1csk2c"
						alt=""
						aria-hidden="true"
						style={{ display: "none" }}
					/>
				) : null}
				<NextIntlClientProvider messages={messages}>
					{children}
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
