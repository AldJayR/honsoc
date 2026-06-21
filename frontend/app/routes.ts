import {
	index,
	layout,
	type RouteConfig,
	route,
} from "@react-router/dev/routes";

export default [
	layout("routes/registration-layout.tsx", [
		index("routes/home.tsx"),
		route("register", "routes/register-step1.tsx"),
		route("register/step2", "routes/register-step2.tsx"),
		route("register/verify", "routes/register-verify.tsx"),
	]),
] satisfies RouteConfig;
