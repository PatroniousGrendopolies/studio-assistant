"use server";

import { requireAdmin } from "@/lib/auth";
import {
  flagMessage as _flagMessage,
  resolveFlag as _resolveFlag,
  createCorrection as _createCorrection,
  toggleCorrection as _toggleCorrection,
} from "@/lib/db";

export async function flagMessage(
  messageId: string,
  flagType: string,
  note: string,
): Promise<void> {
  await requireAdmin();
  await _flagMessage(messageId, flagType, note);
}

export async function resolveFlag(flagId: string): Promise<void> {
  await requireAdmin();
  await _resolveFlag(flagId);
}

export async function createCorrection(input: {
  roomId: string;
  flagId?: string;
  originalMessage: string;
  correction: string;
  context?: string;
}): Promise<void> {
  await requireAdmin();
  await _createCorrection(input);
}

export async function toggleCorrection(
  correctionId: string,
  active: boolean,
): Promise<void> {
  await requireAdmin();
  await _toggleCorrection(correctionId, active);
}
