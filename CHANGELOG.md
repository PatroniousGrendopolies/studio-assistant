# Changelog

## [0.2.0.0] - 2026-04-04 — Admin Dashboard + Feedback Loop

Nigel can now review every conversation users have with the studio assistant, flag bad advice, and write corrections that immediately improve future responses. No redeploy needed.

### Added

- **Chat persistence.** Every message is saved to Supabase Postgres. Conversations are tracked by session, grouped by room. Chat continues working normally if the database is unavailable.
- **Admin dashboard at /admin.** Password-protected login with rate limiting (5 attempts/hr). Conversations list with stats (total chats, today's count, open flags, active corrections). Filter by room.
- **Conversation review.** Read-only chat thread view showing the full exchange. Each assistant message can be flagged as incorrect, dangerous, unclear, or other, with a review note.
- **Corrections feedback loop.** When Nigel flags a message, he can write what the bot should have said instead. Active corrections are injected into the system prompt on every chat request, so the bot learns from its mistakes immediately. Corrections can be toggled on/off.
- **Auth security.** HMAC-SHA256 signed session cookies, timing-safe password comparison, HTTP-only/Secure/SameSite=Strict cookies, server actions verify auth independently of middleware.
- **Test suite.** Auth tests (password, tokens, expiry), DB tests (mocked Supabase, graceful degradation), prompt tests (corrections formatting).

## [0.1.0.0] - 2026-03-28 — Initial Release

Studio assistant chatbot with room-specific AI, safety rules, and voice input.
