import type React from "react";
import { Link } from "react-router";

const imgHonorSocNewLogo1 =
	"http://localhost:3845/assets/83caa9ed1a630c0801bcf3bd61b96c736e29fae7.png";

interface RegistrationLayoutProps {
	children: React.ReactNode;
}

export function RegistrationLayout({ children }: RegistrationLayoutProps) {
	return (
		<div className="min-h-screen bg-brand-background dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
			<div className="w-full max-w-[512px] flex flex-col gap-12 items-center animate-fade-in">
				{/* Header Branding */}
				<div className="flex flex-col gap-4 items-center text-center">
					<Link to="/" className="group focus:outline-none">
						<div className="relative size-[97px] transition-transform duration-300 group-hover:scale-105">
							<img
								alt="NEUST Honor Society Logo"
								className="absolute inset-0 max-w-none object-cover pointer-events-none size-full select-none"
								src={imgHonorSocNewLogo1}
								onError={(e) => {
									// Fallback to a placeholder if the local figma asset server is offline
									e.currentTarget.src =
										"https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80";
									e.currentTarget.className =
										"absolute inset-0 max-w-none object-cover pointer-events-none size-full select-none rounded-full border-2 border-brand-primary";
								}}
							/>
						</div>
					</Link>
					<div className="[word-break:break-word] content-stretch flex flex-col font-sans font-semibold items-center leading-[0] not-italic text-brand-primary text-center tracking-normal select-none">
						<div className="flex flex-col justify-center text-[12px] tracking-widest uppercase">
							<p className="leading-4">NEUST</p>
						</div>
						<div className="flex flex-col justify-center text-0px mt-1">
							<p>
								<span className="[word-break:break-word] font-sans font-semibold leading-[32px] not-italic text-[24px]">
									Honor Society
								</span>
							</p>
						</div>
					</div>
				</div>

				{/* Content Area */}
				<div className="w-full transition-all duration-300">{children}</div>
			</div>
		</div>
	);
}
