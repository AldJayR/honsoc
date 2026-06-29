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
		<div className="min-h-screen bg-brand-background flex flex-col items-center justify-center p-6 transition-colors duration-300">
			<div className="w-full max-w-[512px] flex flex-col gap-12 items-center animate-fade-in">
				{/* Header Branding */}
				<header className="flex flex-col gap-4 items-center text-center">
					<Link
						to="/"
						className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded-lg"
					>
						<div className="relative size-[97px] transition-transform duration-300 group-hover:scale-105">
							<img
								alt="NEUST Honor Society Logo"
								className={`absolute inset-0 max-w-none object-cover pointer-events-none size-full select-none${imgFailed ? " rounded-full border-2 border-brand-primary" : ""}`}
								src={imgFailed ? imgFallback : imgHonorSocNewLogo1}
								onError={() => setImgFailed(true)}
							/>
						</div>
					</Link>
					<div className="[word-break:break-word] content-stretch flex flex-col font-sans font-semibold items-center leading-[0] not-italic text-brand-primary text-center tracking-normal select-none">
						<div className="flex flex-col justify-center text-xs tracking-widest uppercase">
							<p className="leading-4">NEUST</p>
						</div>
						<div className="flex flex-col justify-center mt-1">
							<p>
								<span className="[word-break:break-word] font-sans font-semibold leading-8 not-italic text-2xl">
									Honor Society
								</span>
							</p>
						</div>
					</div>
				</header>

				{/* Content Area */}
				<main className="w-full transition-all duration-300">{children}</main>
			</div>
		</div>
	);
}
