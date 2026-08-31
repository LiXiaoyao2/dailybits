# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

DailyBits serves ordinary users who want lightweight learning content delivered on a regular rhythm. Users browse and subscribe to question banks, knowledge cards, AI news, GitHub trends, and other short-form learning material; creators can upload, generate, and manage their own content; administrators still need a usage overview, but the main product experience is a user-facing learning website, not an admin console.

## Product Purpose

DailyBits turns small pieces of learning material into scheduled push cards. Success means users can quickly find useful content, subscribe without friction, create or upload their own learning material when needed, receive cards at the expected Asia/Shanghai rhythm, and later see enough activity feedback to understand whether their content is being used.

## Positioning

Its mechanism is a simple learning loop: discover useful content, subscribe to a rhythm, receive short cards, and create better material over time. Department-scoped visibility and admin metrics support the product, but they should not make the interface feel like a back-office system.

## Operating Context

The product runs as a Next.js web app with Auth Hub gateway identity, Directory v1 department search, PostgreSQL persistence through Prisma, scheduled background delivery, company Messaging markdown cards for digests/knowledge, and card-service QA cards for interactive questions. User-visible schedules default to Asia/Shanghai and may skip non-working days.

## Capabilities and Constraints

Preserve existing routes, APIs, data models, authentication behavior, and real Chinese product copy. Public, private, and department-visible content must remain available. Question bank subscriptions can be creator-fixed or subscriber-custom. Digest pages use Markdown card pages generated from real source items. Production secrets and API keys must stay in environment variables and out of logs.

## Brand Commitments

The product name is DailyBits. The durable voice is practical, friendly, and concise: learning push, content discovery, question practice, knowledge cards, information digests, subscriptions, uploads, creation, and progress.

## Evidence on Hand

Repository code contains the real workflows and copy under `src/app`, reusable components under `src/components`, shared tokens in `src/app/globals.css`, Prisma schema in `prisma/schema.prisma`, and integration documentation in `README.md`. There are no supplied brand images, customer claims, or external proof assets to fabricate.

## Product Principles

Content discovery should feel welcoming and faster than administration.
Creators should understand who can see content and when it will push without reading docs.
Operational metrics should answer "is this being used?" at a glance.
Push delivery errors should be recoverable internally and never become user-facing content.
Interface density should support repeated work while still feeling like a real user-facing web product.

## Accessibility & Inclusion

The web UI should keep keyboard-accessible controls, visible focus, readable contrast, responsive layouts for desktop and mobile, and clear loading, empty, error, disabled, and overflow states.
