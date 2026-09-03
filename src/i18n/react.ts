import { useCallback, useSyncExternalStore } from "react";
import {
	getLanguage,
	subscribeLanguage,
	translate,
	TranslationFunction,
} from "./index";

export function useTranslation(): TranslationFunction {
	const language = useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
	return useCallback(
		(key, params) => translate(key, params, language),
		[language],
	);
}

export function useLanguage() {
	return useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
}
