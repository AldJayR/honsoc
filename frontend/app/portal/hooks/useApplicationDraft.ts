import { useCallback, useEffect, useRef, useState } from "react";
import type { DraftData } from "~/shared/services/auth.api";
import { deleteDraft, getDraft, saveDraft } from "~/shared/services/auth.api";

const DEBOUNCE_MS = 2000;

interface UseApplicationDraftReturn {
	draft: DraftData | null;
	isSaving: boolean;
	lastSaved: Date | null;
	saveDraft: (data: DraftData) => void;
	clearDraft: () => Promise<void>;
}

export function useApplicationDraft(
	hasSubmitted: boolean,
): UseApplicationDraftReturn {
	const [draft, setDraft] = useState<DraftData | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const loadedRef = useRef(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (hasSubmitted || loadedRef.current) return;
		loadedRef.current = true;

		getDraft()
			.then((result) => {
				if (result) setDraft(result.data);
			})
			.catch(() => {});
	}, [hasSubmitted]);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	const saveDraftToServer = useCallback(async (data: DraftData) => {
		setIsSaving(true);
		try {
			const result = await saveDraft(data);
			setLastSaved(new Date(result.updatedAt));
		} catch {
			// silently fail — draft save is best-effort
		} finally {
			setIsSaving(false);
		}
	}, []);

	const debouncedSave = useCallback(
		(data: DraftData) => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(() => saveDraftToServer(data), DEBOUNCE_MS);
		},
		[saveDraftToServer],
	);

	const clearDraft = useCallback(async () => {
		try {
			await deleteDraft();
		} catch {}
	}, []);

	return {
		draft,
		isSaving,
		lastSaved,
		saveDraft: debouncedSave,
		clearDraft,
	};
}
