import { useCallback, useEffect, useRef, useState } from "react";
import type { DraftData } from "@/shared/services/auth.api";
import { deleteDraft, saveDraft } from "@/shared/services/auth.api";
import { queryClient } from "@/lib/query";

const DEBOUNCE_MS = 2000;

interface UseApplicationDraftReturn {
	draft: DraftData | null;
	isSaving: boolean;
	lastSaved: Date | null;
	saveDraft: (data: DraftData) => void;
	clearDraft: () => Promise<void>;
}

export function useApplicationDraft(
	initialDraft: DraftData | null,
	hasSubmitted: boolean,
): UseApplicationDraftReturn {
	const [draft, setDraft] = useState<DraftData | null>(initialDraft);
	const [isSaving, setIsSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
			setDraft(data);
			queryClient.setQueryData(["draft"], {
				id: result.id,
				data,
				createdAt: new Date().toISOString(),
				updatedAt: result.updatedAt,
			});
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
			setDraft(null);
			queryClient.setQueryData(["draft"], null);
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

