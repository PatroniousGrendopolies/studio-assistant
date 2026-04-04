import { describe, test, expect, beforeEach, mock } from "bun:test";

// ---------------------------------------------------------------------------
// Mock setup — must come before importing the module under test
// ---------------------------------------------------------------------------

// Chainable mock Supabase client — reset per test via resetMockClient()
let mockInsertResult: { data: unknown; error: unknown } = {
  data: { id: "test-uuid" },
  error: null,
};
let mockSelectResult: { data: unknown; error: unknown } = {
  data: { id: "test-uuid" },
  error: null,
};
let mockSelectManyResult: { data: unknown; error: unknown } = {
  data: [],
  error: null,
};

function resetMockClient() {
  mockInsertResult = { data: { id: "test-uuid" }, error: null };
  mockSelectResult = { data: { id: "test-uuid" }, error: null };
  mockSelectManyResult = { data: [], error: null };
}

const mockClient = {
  from: (_table: string) => ({
    insert: (_data: unknown) => ({
      select: (_cols: string) => ({
        single: () => Promise.resolve(mockInsertResult),
      }),
    }),
    select: (..._args: unknown[]) => ({
      eq: (_col: string, _val: unknown) => ({
        single: () => Promise.resolve(mockSelectResult),
        eq: (_col2: string, _val2: unknown) => ({
          order: (_col3: string, _opts: unknown) =>
            Promise.resolve(mockSelectManyResult),
        }),
        order: (_col3: string, _opts: unknown) =>
          Promise.resolve(mockSelectManyResult),
      }),
      order: (_col: string, _opts: unknown) =>
        Promise.resolve(mockSelectManyResult),
    }),
  }),
};

let supabaseConfigured = true;

mock.module("@/lib/supabase.ts", () => ({
  createClient: () => mockClient,
  isSupabaseConfigured: () => supabaseConfigured,
}));

mock.module("@/lib/auth.ts", () => ({
  requireAdmin: async () => {},
}));

// Import after mocks are registered
const {
  upsertConversation,
  saveMessage,
  getActiveCorrections,
} = await import("../../lib/db.ts");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetMockClient();
  supabaseConfigured = true;
});

describe("upsertConversation", () => {
  test("successful insert returns id", async () => {
    mockInsertResult = { data: { id: "conv-123" }, error: null };
    const id = await upsertConversation("session-1", "room-a");
    expect(id).toBe("conv-123");
  });

  test("conflict (duplicate session_id) fetches existing", async () => {
    // Simulate unique-violation error on insert
    mockInsertResult = {
      data: null,
      error: { code: "23505", message: "duplicate key" },
    };
    // The fallback select should return the existing conversation
    mockSelectResult = { data: { id: "existing-conv" }, error: null };

    const id = await upsertConversation("session-1", "room-a");
    expect(id).toBe("existing-conv");
  });

  test("DB error returns null", async () => {
    mockInsertResult = {
      data: null,
      error: { code: "42P01", message: "table does not exist" },
    };
    mockSelectResult = { data: null, error: { message: "also fails" } };

    const id = await upsertConversation("session-1", "room-a");
    expect(id).toBeNull();
  });
});

describe("saveMessage", () => {
  test("successful insert does not throw", async () => {
    mockInsertResult = { data: { id: "msg-1" }, error: null };
    expect(async () => {
      await saveMessage("conv-1", "user", "Hello");
    }).not.toThrow();
  });

  test("DB error does not throw (graceful degradation)", async () => {
    mockInsertResult = {
      data: null,
      error: { message: "insert failed" },
    };
    expect(async () => {
      await saveMessage("conv-1", "assistant", "Hi there");
    }).not.toThrow();
  });
});

describe("getActiveCorrections", () => {
  test("returns corrections array", async () => {
    const corrections = [
      {
        id: "corr-1",
        room_id: "room-a",
        flag_id: null,
        original_message: "Use slot 3",
        correction: "Use slot 7 via the preamp",
        context: "Patchbay routing",
        active: true,
        created_at: "2026-03-15T10:00:00Z",
      },
    ];
    mockSelectManyResult = { data: corrections, error: null };

    const result = await getActiveCorrections("room-a");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe("corr-1");
    expect(result[0]!.correction).toBe("Use slot 7 via the preamp");
  });

  test("returns empty array on error", async () => {
    mockSelectManyResult = {
      data: null,
      error: { message: "query failed" },
    };
    const result = await getActiveCorrections("room-a");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test("returns empty array when Supabase not configured", async () => {
    supabaseConfigured = false;
    const result = await getActiveCorrections("room-a");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});
