import envCore from "./env/envcore.json";
import envVoid from "./env/envvoid.json";

export const ENVIRONMENTS = [
	...envCore,
	...envVoid,
];

export type EnvironmentData = (typeof envCore)[0];
