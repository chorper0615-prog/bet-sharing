# Bet Sharing Design

## Goal

Add "赌注共享" so a user can share one bet through a five digit code, and another user can enter that code to view and import the shared bet.

## Recommended Flow

Each bet card gets a share action. When the user confirms sharing, the app saves that single bet to Supabase and displays a five digit numeric code. The user can copy the code and send it to someone else.

The list screen gets a share-code entry action. A receiving user enters the five digit code, the app fetches the shared bet from Supabase, shows a preview, and lets the user import it into the local bet list.

## Data

Use a Supabase table named `bet_shares`.

Required columns:

- `code text primary key`
- `bet jsonb not null`
- `created_at timestamptz not null default now()`

The app only stores the single selected bet in Supabase. It does not upload the user's full local list.

## Architecture

Create a small Supabase client module and a focused bet sharing service. The service owns code generation, insert retry behavior, input validation, and lookup behavior. React components call that service and keep UI state local to the modal/entry points.

## UI

Add a share button to each `BetCard`. Clicking it opens a compact modal for creating a code. After success, the modal shows the five digit code and a copy button.

Add a share-code button near the search/filter controls in `App`. Clicking it opens a compact modal where a user can enter a code. If found, the modal previews player names, bet content, stake, and claims. Confirming import adds a new local bet record with a new id and current `createdAt`.

## Error Handling

If Supabase environment variables are missing, show a clear setup message and leave local app behavior untouched. If the code is not five digits, validate before querying. If no record exists for a code, show a not-found message. If a generated code conflicts, retry before showing an error.

## Testing

Add Vitest unit tests for the sharing service:

- accepts only five digit codes
- generates five digit codes
- retries on Supabase duplicate-code conflicts
- returns `null` for missing shared codes
- clones an imported bet with a new id and pending local identity
