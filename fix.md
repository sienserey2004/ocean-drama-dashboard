Contents

1. Role Separation
2. Navigation
3. User Experience
4. Visual Consistency
5. Permissions & Access
6. Dashboard Design
7. Layout
8. Branding
9. Summary Matrix
UI/UX Audit Report
Ocean Drama App
Reviewer
Senior UI/UX & Product Designer
Date
July 1, 2026
App Type
Drama Streaming Platform
Roles Reviewed
Admin · Creator · Viewer
Stack
React 18 · MUI v5 · Tailwind · Zustand · React Router v6
5
Critical
Security, broken routes, misleading data
8
High
Broken flows, hidden features, wrong UX patterns
10
Medium
Inconsistencies, jargon, visual clashes
7
Nice-to-Have
Polish, navigation improvements, onboarding
01
Role Separation
The app has three roles — Admin, Creator, and Viewer — spread across two layouts (DashboardLayout and ViewerLayout). While the routing is mostly correct, several screens fail to communicate which role context the user is in, and one guard has a logic bug that blurs role boundaries entirely.

Viewers can access creator-only routes due to guard logic bug
Critical
CreatorGuard uses the condition !isAdmin && !isCreator && role !== 'viewer' — which means viewer role passes the check. A viewer can navigate directly to /dashboard/videos/create, a route that should be creator/admin only. The role !== 'viewer' clause is a logical mistake — it should be an OR of allowed roles, not an exclusion.

src/app/router/guards/CreatorGuard.tsx · line 10
Fix: Change the condition to if (!isAdmin && !isCreator) return <Navigate to="/dashboard" replace />. This correctly blocks all non-creator, non-admin roles.
No visual indicator telling the user which role/mode they are in
Medium
Both Admins and Creators land on the same DashboardLayout. The sidebar says "OCEAN DRAMA APP — Monitoring System" for everyone. There is no role badge, mode label, or header indicator distinguishing Admin from Creator from Viewer once logged in. An admin can easily lose track of which permissions they're operating under — especially if they also have creator content.

Suggest: Add a small role indicator chip in the AppBar or sidebar header — e.g. a pill reading "Admin" in red-tinted background, "Creator" in blue-tinted. This single addition eliminates an entire class of role confusion.
App Studio is accessible to all roles with no role check
Medium
/dashboard/app-studio has no CreatorGuard — any authenticated user can reach it. The route also appears in both viewer.route.tsx (under /) and dashboard.route.tsx — creating two separate entry points for the same creator-centric page. An admin visiting it sees creator stats (not admin analytics), causing silent role confusion.

src/app/router/dashboard.route.tsx · line 38  |  src/app/router/viewer.route.tsx · line 19
Suggest: Wrap /dashboard/app-studio inside CreatorGuard. Remove the duplicate viewer-route entry unless the intent is genuinely a shared page, in which case it needs clear admin vs creator branching similar to AnalyticsPage.
"Monitoring System" subtitle is an admin label shown to all roles
Medium
The sidebar logo section subtitles the app as "Monitoring System" regardless of role. A creator visiting their dashboard to manage dramas is not monitoring a system. This language is appropriate only for an admin and makes the creator dashboard feel austere and impersonal.

src/_ocean/layout/DashboardLayout.tsx · line 218
Suggest: Derive this subtitle from role: Admin → "Admin Console", Creator → "Creator Studio", Viewer → no subtitle needed. One line of conditional rendering.
02
Navigation
The navigation system has two surfaces — a sidebar (dashboard) and a top navbar (viewer). Both have structural issues: one has a dead link, another navigates to the wrong layout, and the mobile bottom nav has a calculation bug that will misplace the active indicator for certain user roles.

"Messages" link in the viewer navbar navigates to a 404
Critical
The DesktopNavbar includes a "Messages" nav item that points to /messages. This route does not exist in viewer.route.tsx, dashboard.route.tsx, or auth.route.tsx. Any user clicking it lands on the 404 Not Found page.

src/_ocean/layout/components/DesktopNavbar.tsx · line 32
Fix: Either build the Messages feature and add the route, or remove "Messages" from the navbar entirely until it's ready. A nav item leading to a 404 is worse than no nav item at all.
"Reward Center" in the Dashboard sidebar navigates to the wrong layout
High
The sidebar navigation item "Reward Center" in the Personal Space group links to /coins. This route lives inside ViewerLayout, not DashboardLayout. Clicking it while in the dashboard causes an abrupt layout switch — the entire chrome (sidebar, AppBar, theme) disappears and is replaced by the black viewer layout with mobile bottom nav.

src/_ocean/layout/DashboardLayout.tsx · line 126
Suggest: Either move the Coins page into the dashboard routes (/dashboard/coins) and adapt it to the DashboardLayout, or remove this item from the sidebar and link to it from the Profile page or user menu instead.
Mobile bottom nav indicator calculation breaks when 6 items are rendered
High
The sliding indicator pill in MobileBottomNav uses left: ${(activeIndex * 19.5) + 2}%, which is hardcoded math for exactly 5 items. DashboardLayout passes 6 items via viewerDashboardNavItems when the role is viewer. With 6 items, each item is ~16.6% wide, but the indicator still jumps in 19.5% increments — placing it visually on the wrong item for indices 4 and 5.

src/_ocean/layout/components/MobileBottomNav.tsx · line 122
Fix: Calculate the step dynamically: const step = 100 / currentItems.length and use left: ${(activeIndex * step) + (step * 0.1)}% and width: ${step * 0.85}%. This adapts to any item count.
Sidebar group labels use enterprise SaaS jargon
Medium
The nav groups are labelled "Analytics & Monitoring", "Content Governance", "My Creative Studio", and "Personal Space". The first two belong to enterprise operations software, not a drama streaming platform. "Global Library" as a nav item label is vague — users don't know if it means their library or a platform-wide browse.

Suggest: Align labels with what creators and admins actually say. "Analytics & Monitoring" → "Performance". "Content Governance" → "All Content" (admin) / "Browse" (creator). "My Creative Studio" → "My Content". "Personal Space" → "Account". "Global Library" → "Browse Platform".
Three separate viewer profile destinations with no linking
Medium
A viewer has three profile-related routes: /profile (ClientProfilePage — social profile), /profile-screen (ProfileScreen — watch history & stats), and /dashboard/profile (ProfilePage — account settings). None of these pages link to the others. A user can't discover account settings from the social profile page.

Suggest: Consolidate into a single profile route with tabs: "Profile" / "History" / "Settings". If that's too large a refactor, at least add navigation links between them at the top of each page.
No breadcrumbs for nested routes
Nice-to-Have
Deep routes like /dashboard/videos/:videoId/episodes have no breadcrumb navigation. Users arriving from a link can't tell which video they're managing episodes for, and can only navigate back via the browser's back button.

Suggest: Add a simple breadcrumb at the top of EpisodesPage: Library → [Series Title] → Episodes. A two-line component using useParams and the video title from the existing fetch.
03
User Experience
Several workflows have friction or outright breaks — fake chart data shown as real analytics, a permanently-wrong notification badge, a search bar that disappears on mobile, and an overly destructive delete confirmation. These create moments where trust in the app is lost.

Creator Studio performance chart displays hardcoded fake data
Critical
The AppStudio Dashboard's "Performance" section renders a line chart using const chartData = [2400, 1398, 9800, 3908, 4800, 3800, 4300] — static placeholder values that never change regardless of the creator's actual view counts. A creator sees this and may make decisions (upgrading, uploading more) based on completely fabricated metrics.

src/app/module/client/app-studio/module/dasboard/Dashboard.tsx · line 91
Fix: Replace with real data from the creatorApi, or remove the chart until the API provides time-series data. At minimum, add a visible "Demo Data" label if placeholder values are intentional during development — never ship fake metrics as real.
Notification badge is permanently hardcoded to "4"
Critical
The AppBar notification bell always shows badgeContent={4}. This number never updates, never clears, and is not connected to any API or store. Users who click the bell expecting 4 notifications will find nothing. After one interaction, users will permanently ignore the notification icon — destroying its utility when real notifications are added later.

src/_ocean/layout/DashboardLayout.tsx · line 430
Fix: Connect to the notificationApi service that already exists in src/app/api/. If not ready, remove the badge entirely — showing 0 or nothing is always better than a permanent lie.
Search is hidden on mobile in MyVideosPage — creators can't search on phone
High
The search input has className="px-4 hidden sm:block" — it's invisible on mobile viewports. Status filter pills are visible, but searching by title (the primary way to find a specific series) is completely unavailable on phones. Given the app's mobile-first viewer audience, creators likely also manage content from mobile.

src/app/module/shared/my-videos/MyVideosPage.tsx · line 244
Fix: Replace with a collapsible search — show a search icon in the header on mobile, expand to a full-width input on tap. This is the standard mobile pattern and requires minimal code change.
Creator Analytics page is nearly empty for non-admin users
High
The AnalyticsPage shows 8 stat cards, 2 charts, and a performance table — but only for admins. A creator navigating to "Content Performance" in their sidebar sees just 3 earnings cards with empty space around them and no explanation. The page header reads "Platform Insights" and shows a "Live Monitoring" badge — labels that actively mislead creators into thinking there's more data they're not loading.

src/app/module/shared/analytics/AnalyticsPage.tsx · lines 131–256
Suggest: Build a dedicated Creator analytics view with creator-specific metrics: views per video, episode completion rates, earnings trends, subscriber growth. The admin and creator experiences should be separate components with shared infrastructure, not a single component with a large admin-only block.
Delete video uses a browser confirm() dialog
High
The delete action calls if (!confirm('Delete this video and all its episodes?')). The browser's native confirm dialog is unstyled, blocks the JS thread, cannot be dismissed with app-consistent patterns, and on mobile can appear identical to a phishing popup. It also provides no visual context (no thumbnail, no title of what's being deleted).

src/app/module/shared/my-videos/MyVideosPage.tsx · line 149
Fix: Replace with an in-app confirmation modal. Show the series thumbnail, title, and an explicit warning about episode deletion. Require the user to type the series name or press a clearly-labeled "Delete Series" button. This pattern is standard in Vercel, Linear, and GitHub.
"Earn: LOCKED / UPGRADE" rendered as a stat metric card
High
In the AppStudio stats grid, the Earn card shows value: "LOCKED" and change: "UPGRADE". The change field is visually styled as a trend percentage badge — so "UPGRADE" appears in an orange badge where "+12.5%" would appear for unlocked metrics. This is semantically wrong and confusing: the UI pattern implies a numeric trend, but the content is a marketing call-to-action.

src/app/module/client/app-studio/module/dasboard/Dashboard.tsx · lines 69–76
Suggest: Replace the entire Earn card with a distinct "upgrade prompt" component — a card with a lock icon, "Unlock Earnings Tracking", a brief benefit statement, and a primary CTA button. Don't shoe-horn a call-to-action into a metric display slot.
"Coverage Stats: 100% Operational" is static, meaningless text
Medium
The sidebar footer displays "Coverage Stats — 100% Operational" with an AutoGraph icon. This text is hardcoded and never changes. It implies system health monitoring, but there's no backend data behind it. It reads as a placeholder that was never removed, and will confuse admins who might expect it to reflect actual system status.

src/_ocean/layout/DashboardLayout.tsx · lines 299–307
Suggest: Either connect it to a real system health endpoint, or remove it entirely. A sidebar footer could better serve the user with the app version number, a link to documentation, or nothing at all.
"Terminate Session" and "System Search…" are aggressive, off-brand language
Medium
The logout button is labelled "Terminate Session" and the search placeholder reads "System Search…". These phrases belong in enterprise DevOps dashboards. For a drama streaming app used by creators managing their content, "Log Out" and "Search…" are the industry-standard labels — unambiguous, familiar, and on-brand.

src/_ocean/layout/DashboardLayout.tsx · lines 315, 420
Fix: Rename to "Log Out" and "Search…". Two string changes. Also rename the logout success toast from "System session terminated" to "You've been logged out."
No onboarding for new creators with zero videos
Nice-to-Have
When a new creator has uploaded no videos, MyVideosPage shows a generic empty state: "No Series Found — Start by creating your first drama series." There's no guidance on what to upload, what makes a good series, or what happens after upload (review, approval). The "Create New Series" button is the only CTA — but new creators don't know the full workflow.

Suggest: Add a 3-step onboarding checklist for new creators (similar to Substack's or Notion's activation flow): 1. Complete profile, 2. Create your first series, 3. Upload your first episode. This dramatically improves creator activation rates.
04
Visual Consistency
The most pervasive issue in the app is visual fragmentation. Pages inside the same DashboardLayout shell use three different color systems, two different UI toolkits (MUI and Tailwind), and five or more border-radius values with no shared scale. The result is a product that feels assembled from independent projects.

AppStudio and MyVideos are hardcoded dark and ignore the theme toggle
High
DashboardLayout implements a full dark/light mode toggle. However, AppStudioDashboard and MyVideosPage use hardcoded Tailwind classes like bg-[#08090C] and text-white. When a user switches to light mode, these pages stay pitch-black while the shell (sidebar, header, other pages) turns light. The two pages appear to be completely different applications inside the same layout.

Dashboard.tsx · line 95  |  MyVideosPage.tsx · line 199
Suggest: Refactor these pages to use MUI's bgcolor: 'background.default' / color: 'text.primary' tokens, or extend Tailwind with CSS variables that the theme toggle can control. Either approach eliminates the hardcoded colors.
Three different accent colors within the same dashboard shell
Medium
Pages inside DashboardLayout use three distinct accent colors with no relationship to each other: Azure blue #0EA5E9 (sidebar, header), Red #E50914 (AppStudio, MyVideos, floating buttons), and Indigo indigo-600 (Edit modal, empty state CTA, form inputs in MyVideos). A user navigating between pages experiences a constant color-scheme context switch.

Suggest: Choose one primary accent for the dashboard (the existing azure #0EA5E9 is the strongest candidate — it's already in the theme config and the sidebar). Red should be semantic-only (danger, delete actions). Indigo should be removed or consolidated with the primary.
Border radius has no consistent scale — at least 6 different values in use
Medium
Observed radius values across the dashboard: rounded-[2rem] (AppStudio cards), rounded-[2.5rem] (AppStudio chart), borderRadius: '24px' (Analytics stat cards), rounded-xl (filter pills in MyVideos), borderRadius: '12px' (sidebar nav buttons), borderRadius: '16px' (user dropdown), rounded-3xl (MyVideos bottom sheet). No two adjacent surfaces agree.

Suggest: Define a 4-step radius scale in Tailwind config and MUI theme: sm (6px, pills/chips), md (12px, buttons/inputs), lg (16px, cards), xl (24px, modals/panels). Apply uniformly. This is a ~2 hour refactor with high visual impact.
Empty state card uses white background on a dark page
Medium
When MyVideosPage has no videos, the empty state renders a bg-white rounded-3xl p-12 card with light slate text. The page background is bg-[#08090C] (near-black). The white card appears as a visual glitch — like an un-themed component dropped into the wrong page, not an intentional design choice.

src/app/module/shared/my-videos/MyVideosPage.tsx · line 267
Fix: Use bg-white/[0.03] or bg-white/5 (the same glass-card pattern used elsewhere on that page) with white text. Match the visual language of the surrounding page.
Font weights vary without a scale — 500, 600, 700, 800, 900 all used freely
Nice-to-Have
The codebase uses font-black (900), fontWeight: 800, fontWeight: 700, font-bold (700), and font-medium (500) interchangeably for labels, body text, headings, and captions. There is no defined type scale that maps weight to semantic role (heading vs body vs label vs caption).

Suggest: Define a scale in the theme: Display/H1: 900, H2/H3: 800, Body: 400, Emphasis: 600, Label: 700 uppercase. Apply via MUI's typography config so it propagates globally.
05
Permissions & Access
Beyond the CreatorGuard bug already noted, there are secondary access issues — admin-only actions mixed into shared creator UI, no visual distinction when an admin is performing moderation vs. a creator managing their own content, and locked features that provide unclear messaging about why they're locked.

"My Video Assets" label used when Admin is viewing all platform videos
Medium
The sidebar item and page subtitle both say "My" — but when an admin visits /dashboard/videos, they see every creator's videos on the platform, not just their own. The admin sub-label does read "Admin Overview" on the page, but the sidebar navigation, the route name, and the page title all say "My", which creates a disconnect. Admins may not realize they're looking at platform-wide content.

Suggest: For admin users, show a separate sidebar item labelled "All Platform Videos" (or rename the existing item conditionally). The admin and creator views serve completely different purposes and should feel clearly distinct.
Approve/Reject admin actions appear only on mobile bottom sheet, invisible on desktop
Medium
The Approve and Reject video buttons for admins only appear inside the mobile options bottom sheet, triggered by the MoreVertical icon. On desktop, admins see the same video grid as creators but with no visible moderation actions — they must hunt for the action via the hover overlay. This is backwards: admins spend more time on desktop and need the moderation workflow to be front and center.

src/app/module/shared/my-videos/MyVideosPage.tsx · lines 338–356
Suggest: On desktop, show an "Actions" column in admin view with Approve/Reject buttons directly on the card or in a table row. The mobile bottom sheet is a good pattern, but desktop users should never have fewer actions than mobile users.
Locked features don't explain what role or plan is required
Medium
The AppStudio Earn card is locked with the text "LOCKED" and "UPGRADE". There's no explanation: locked because the user isn't a premium subscriber? Because they're a viewer, not a creator? Because they haven't verified their account? A viewer seeing "LOCKED" on the Earn card has no idea what they need to do to unlock it — or if they even can.

Suggest: Every locked feature should answer: Who can use this? and How do I get access?. Example: "Earnings tracking is available on the Premium Creator plan. [Upgrade →]". If it requires a role change (viewer → creator), explain that too.
No confirmation that a content moderation action (approve/reject) was applied to the right item
Nice-to-Have
When an admin approves or rejects a video via the bottom sheet, a success toast appears but the admin has already closed the sheet. There's no final "You approved: [Series Title]" confirmation. In a high-volume moderation queue, an admin could accidentally approve the wrong video with no visual checkpoint.

Suggest: Show a short confirmation step: "Approve [Series Title]? This will make it public." → Confirm. One extra click that prevents irreversible errors in moderation workflows.
06
Dashboard Design
The app has three functionally different dashboards — the Admin dashboard (AnalyticsPage at /dashboard/analytics), the Creator dashboard (AnalyticsPage limited view + AppStudio), and the Viewer dashboard (AppStudio only). Each is reviewed separately below.

Admin Dashboard — /dashboard/analytics
8 platform-wide stat cards with progress bars
Top episodes performance table
Social engagement breakdown (likes, comments, shares)
No date/time-range filter on any metric
No trend charts — only static numbers
No moderation queue count / pending video alert
Page says "Platform Insights" — no indication this is the Admin view
Creator earnings mixed into admin analytics view
Add: New user registrations trend, revenue chart, active moderation queue widget
Creator Dashboard — AppStudio + Analytics
4 stat cards (Views, Earn, Subs, Videos)
Recent videos list with status
Floating upload button — good discoverability
Chart uses hardcoded fake data (critical bug)
No per-video performance breakdown
Earn stat shows LOCKED instead of an upgrade CTA
No greeting or personalization — feels generic
Two separate pages (AppStudio + AnalyticsPage) cover overlapping creator data
Add: Upload CTA on empty state, earnings trend, subscriber growth chart, episode completion rates
Admin and Creator both land on the same AnalyticsPage with no differentiation in the entry
High
Both admin and creator navigate via the same sidebar item ("Content Performance") to the same URL (/dashboard/analytics). An admin sees 8 platform-wide cards; a creator sees 3 earnings cards. There is no dashboard home screen that differs by role — both see the same page title, same "Live Monitoring" badge, and the same layout wrapper. The dramatically different content inside creates confusion about what the page is for.

Suggest: Create separate dashboard home routes: /dashboard/admin and /dashboard/creator, each with purpose-built components. Route /dashboard to the appropriate one based on role. Share API utilities and stat card components between them, but keep the page structure and information hierarchy role-specific.
No admin-specific quick actions or moderation alerts on the dashboard
Medium
The admin dashboard shows platform metrics but lacks the most operationally important admin information: how many videos are pending review, how many reports are unresolved, and which content is flagged. An admin opening the dashboard has no at-a-glance indication of what needs their immediate attention — they have to navigate to separate pages to discover the work queue.

Suggest: Add a "Needs Attention" widget at the top of the admin dashboard: pending moderation count (linked to MyVideosPage filtered to pending), and any user reports. A simple count card with a link is sufficient — this is the first thing every admin should see.
07
Layout
The macro layout — sidebar, header, main content area — is well structured. The collapsible sidebar, glassmorphic content panels, and mobile drawer are all solid patterns. The issues are in the details: a stale closure risk in the sidebar memo, and the sidebar's collapse toggle being in the wrong place.

Sidebar collapse button is in the AppBar, not the sidebar — wrong affordance placement
Medium
The button to collapse/expand the sidebar lives in the top AppBar (ChevronLeft/ChevronRight IconButton). The sidebar and its toggle should be self-contained. When the sidebar is collapsed to icon-only mode, the toggle button is now separated from what it controls by the full header width. Users scan the sidebar edge to collapse it (the universal pattern), not the header toolbar.

src/_ocean/layout/DashboardLayout.tsx · lines 391–400
Suggest: Move the collapse button to the bottom of the sidebar, or add a toggle arrow at the right edge of the sidebar panel itself. The AppBar can still have a hamburger for mobile, but the desktop collapse should live on the sidebar.
SidebarContent useMemo has a stale closure risk on handleLogout
Medium
SidebarContent is wrapped in useMemo with a dependency array of [collapsed, location.pathname, isAdmin, isCreator, mobileOpen, user]. The memo renders a logout button that calls handleLogout. But handleLogout is defined outside the memo and depends on logout and clearSubscription — neither of which is in the deps array. On token refresh, the closure captures stale logout callbacks.

src/_ocean/layout/DashboardLayout.tsx · lines 175, 319
Fix: Either add handleLogout to the deps array, or (better) move the logout button outside the memoized SidebarContent so it's always fresh. The logout button doesn't need to be memoized — it renders in under 1ms.
The AppBar search bar has no functional implementation
Nice-to-Have
The dashboard AppBar has a prominent search input (placeholder="System Search..."). It renders an InputBase with a Search icon, but there's no onChange, onSubmit, or API connection. Typing in it does nothing. A visible search bar that doesn't work is more damaging than no search bar — users trust visible UI elements to be functional.

Suggest: Either build the search (connect to videos, users, and episodes), or remove the input and replace it with a keyboard shortcut hint (e.g. "⌘K Search") that could open a command palette later. Don't display non-functional UI.
Tables need horizontal scroll containers on mobile
Nice-to-Have
The top episodes table in AnalyticsPage wraps in a TableContainer but does not have a min-width constraint. On small tablets and phones, the table columns compress until text becomes illegible or overflows the container. The earnings table in EarningsPage has the same issue.

Fix: Add sx={{ overflowX: 'auto' }} to each TableContainer and set a minWidth: 500 on the inner Table. Standard MUI pattern, 2-line fix per table.
08
Branding
The app uses three different product names across three surfaces. This is the single most visible trust-destroying issue for new users, who may think they've navigated to a different product or that the dashboard is a third-party tool rather than the same app they signed up for.

Surface	Product Name Used	Subtitle	Accent Color	File
Login Page	"DramaStream"	Dashboard Portal	#3B82F6 blue	LoginPage.tsx:79
Dashboard Sidebar	"OCEAN DRAMA APP"	Monitoring System	#0EA5E9 azure	DashboardLayout.tsx:215
Viewer Navbar	"OCEAN DRAMA"	(none)	#FF2D2D red	DesktopNavbar.tsx:72
Creator Studio Page	"Creator Studio"	Analytics · Upload · Earn	#E50914 red	Dashboard.tsx:103
Four different product names used across the application
Critical
"DramaStream" (login), "OCEAN DRAMA APP" (dashboard sidebar), "OCEAN DRAMA" (viewer navbar), and "Creator Studio" (studio header) are all used as the product name. A new user signs up on a page branded "DramaStream" and then lands in a sidebar that says "OCEAN DRAMA APP". This causes confusion about what product they're in and damages brand trust from the first session.

Fix: Decide on one canonical product name and apply it everywhere. Based on the project name (ocean-drama-app), the Tailwind config color names ("ocean"), and the domain, "Ocean Drama" or "Ocean Drama App" appears to be the intended name. Update LoginPage.tsx immediately — it's the first thing every user sees.
Admin and Viewer panels share the same brand identity — they should be visually distinct
Medium
Both the admin dashboard and the viewer app use dark backgrounds with colored accents, similar nav patterns, and the same logo mark. At a glance, an admin looking at a screenshot can't immediately tell if they're in the admin console or the consumer app. Industry standard is a visual distinction: GitHub uses a separate github.com vs github.com/admin experience, Shopify separates admin from storefront, Stripe uses different nav patterns for dashboard vs developer dashboard.

Suggest: Give the admin console a distinct visual treatment. Candidate approaches: (1) Add a persistent "Admin" banner at the top in a muted warning color. (2) Use a slightly different sidebar color (e.g. the deep slate #020617 stays, but add a colored left rail accent in red or amber for admin). (3) Add "ADMIN CONSOLE" as the sidebar subtitle for admin users. Any of these makes the role unmistakable.
"App Studio" vs "Creator Studio" naming inconsistency
Nice-to-Have
The sidebar nav item says "App Studio", the route is /dashboard/app-studio, but the page header says "Creator Studio". The component file is named Dashboard.tsx in a folder called dasboard (note: typo in folder name). Three different names for the same feature makes it impossible to discuss internally or document externally.

Fix: Standardize on "Creator Studio" (it's the most user-facing and descriptive name). Rename the folder from dasboard to dashboard to fix the typo. Update the route to /dashboard/creator-studio for clarity.
09
Summary Matrix
All 30 findings consolidated and ranked. Fix Criticals before any new feature work. High-priority items before any public launch. Mediums can be batched into a design-system sprint. Nice-to-haves are backlog candidates.

#	Severity	Issue	Section
01	Critical	CreatorGuard logic allows viewers to access creator routes	Role Separation
02	Critical	Four different product names across the app	Branding
03	Critical	"Messages" nav link leads to a 404 page	Navigation
04	Critical	Performance chart shows hardcoded fake data as real metrics	User Experience
05	Critical	Notification badge permanently hardcoded to "4"	User Experience
06	High	"Reward Center" sidebar item navigates to the wrong layout	Navigation
07	High	Mobile bottom nav indicator math breaks with 6 items	Navigation
08	High	AppStudio & MyVideos ignore light/dark theme toggle	Visual Consistency
09	High	Mobile search hidden on MyVideosPage	User Experience
10	High	Creator Analytics page nearly empty with no empty state	User Experience
11	High	Delete action uses browser confirm() dialog	User Experience
12	High	"Earn: LOCKED / UPGRADE" rendered as a trend metric badge	User Experience
13	High	Admin and Creator land on the same AnalyticsPage with no differentiation	Dashboard Design
14	Medium	No visual role indicator in header or sidebar	Role Separation
15	Medium	App Studio accessible to all roles without a guard	Role Separation
16	Medium	"Monitoring System" shown to all roles	Role Separation
17	Medium	Three separate viewer profile pages with no linking	Navigation
18	Medium	Sidebar group labels use enterprise SaaS jargon	Navigation
19	Medium	"Coverage Stats: 100% Operational" is static, meaningless text	User Experience
20	Medium	"Terminate Session" / "System Search…" are off-brand labels	User Experience
21	Medium	Three different accent colors inside the same layout shell	Visual Consistency
22	Medium	Border radius has no consistent scale — 6+ different values	Visual Consistency
23	Medium	Empty state card uses white background on dark page	Visual Consistency
24	Medium	"My Video Assets" label used when Admin views all platform videos	Permissions & Access
25	Medium	Approve/Reject buttons invisible on desktop — mobile only	Permissions & Access
26	Medium	Locked features don't explain required role or plan	Permissions & Access
27	Medium	SidebarContent useMemo has stale closure on handleLogout	Layout
28	Medium	Admin & Viewer share identical brand identity — should differ	Branding
29	Nice-to-Have	No breadcrumbs for nested routes like Episodes	Navigation
30	Nice-to-Have	No creator onboarding for first-time uploaders	User Experience
Recommended fix order: Issues 1–5 (Criticals) should be resolved before anything else — three are security/trust issues and two are data integrity issues. Issues 6–13 (Highs) before any public launch or creator beta. Issues 14–28 (Mediums) can be batched into a 2-sprint design-system pass. Issues 29–30 are backlog candidates for the post-launch roadmap.






Fix CreatorGuard logic bug — viewers bypass creator routes

Fix brand names — unify to 'Ocean Drama' across Login, Dashboard, Viewer navbar

Remove broken Messages nav link in DesktopNavbar

Remove hardcoded fake chart data in AppStudio Dashboard











Fix hardcoded notification badge of '4' in DashboardLayout

Fix 'Reward Center' sidebar link — wrong layout (goes to /coins viewer route)

Fix mobile bottom nav indicator math — breaks with 6 items

Fix AppStudio & MyVideos hardcoded dark theme — must respect theme toggle

Fix mobile search hidden on MyVideosPage











Replace browser confirm() delete dialog with in-app modal

Replace 'Earn: LOCKED/UPGRADE' stat card with proper upgrade CTA

Add role indicator chip to AppBar/sidebar header

Add CreatorGuard to /dashboard/app-studio route

Make sidebar subtitle role-aware (not always 'Monitoring System')









Rename sidebar nav group labels — remove enterprise jargon

Remove 'Coverage Stats: 100% Operational' static text from sidebar

Rename 'Terminate Session' → 'Log Out' and 'System Search…' → 'Search…'

Fix empty state white card on dark background in MyVideosPage

Fix 'My Video Assets' label shown to admin — should differ by role

Show Approve/Reject buttons on desktop card (not only mobile bottom sheet)

Fix useMemo stale closure on handleLogout in DashboardLayout

Add locked feature explanation to 'Earn' upgrade prompt