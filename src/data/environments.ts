import coreEnv from "env/coreEnv.json";

export const ENVIRONMENTS = {
	coreEnv,
};

export type EnvironmentData = (typeof coreEnv)[0];
