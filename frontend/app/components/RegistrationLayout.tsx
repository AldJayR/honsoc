import type React from "react";
import { useState } from "react";
import { Link } from "react-router";

const imgHonorSocNewLogo1 = "/images/honor-soc-new-logo.png";
const imgFallback =
	"https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80";

interface RegistrationLayoutProps {
	children: React.ReactNode;
}

export function RegistrationLayout({ children }: RegistrationLayoutProps) {
	const [imgFailed, setImgFailed] = useState(false);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-6 transition-colors duration-300 bg-background">
			<div className="w-full max-w-[512px] flex flex-col gap-12 items-center animate-fade-in">
				{/* Header Branding */}
				<header className="flex flex-col items-center gap-4 text-center">
					<Link
						to="/"
						className="rounded-lg group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
					>
						<div className="relative size-[97px] transition-transform duration-300 group-hover:scale-105">
							<img
								alt="NEUST Honor Society Logo"
								className={`absolute inset-0 max-w-none object-cover pointer-events-none size-full select-none${imgFailed ? " rounded-full border-2 border-primary" : ""}`}
								src={imgFailed ? imgFallback : imgHonorSocNewLogo1}
								onError={() => setImgFailed(true)}
							/>
						</div>
					</Link>
					<div className="font-sans font-semibold text-primary text-center select-none">
						<p className="text-xs tracking-widest leading-4">NEUST</p>
						<p className="text-2xl leading-8">Honor Society</p>
					</div>
				</header>

				{/* Content Area */}
				<main className="w-full transition-all duration-300">{children}</main>
			</div>
		</div>
	);
}
