import envCore from "./env/envcore.json";
import envVoid from "./env/envvoid.json";
import envSablewood from "./env/envsablewood.json";

export const ENVIRONMENTS = [
	...envCore,
	...envVoid,
	...envSablewood,
];

export type EnvironmentData = (typeof envCore)[0];
