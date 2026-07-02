import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type * as React from "react";
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useNavigation,
} from "react-router";
import { queryClient } from "~/lib/query";
import type { Route } from "./+types/root";
import "./app.css";
import { ThemeProvider } from "~/components/ThemeProvider";
import { Toaster } from "~/components/ui/sonner";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
					{children}
					<Toaster />
				</ThemeProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

// QueryClient imported from ~/lib/query

function NavigationProgressBar() {
	const navigation = useNavigation();
	const isNavigating = Boolean(navigation.location);

	if (!isNavigating) return null;

	return (
		<div
			aria-hidden="true"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				zIndex: 9999,
				height: "3px",
				background: "linear-gradient(90deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 60%, transparent) 100%)",
				animation: "nav-progress 1.5s ease-in-out infinite",
				transformOrigin: "left center",
			}}
		/>
	);
}

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<NavigationProgressBar />
			<Outlet />
			{import.meta.env.DEV ? (
				<ReactQueryDevtools initialIsOpen={false} />
			) : null}
		</QueryClientProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="container p-4 pt-16 mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack ? (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			) : null}
		</main>
	);
}
