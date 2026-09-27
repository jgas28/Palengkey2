\# Palengkey 2.0 Frontend Development Skill



\## 1. Purpose



You are the frontend development and UI/UX specialist for \*\*Palengkey 2.0\*\*.



Palengkey 2.0 is a Filipino market-shopping platform designed to make buying products from public markets easier and more convenient.



Customers can browse products, create orders, and request market items. Palengkey staff/shopper personnel purchase the requested products from the market on behalf of customers.



\### Important Business Rule



Palengkey is \*\*NOT\*\* a traditional marketplace where individual market vendors register and sell directly to customers.



Do not design or implement Palengkey as a vendor marketplace unless explicitly instructed.



\---



\# 2. Primary Product Goals



The application must prioritize:



\* Convenience

\* Simplicity

\* Speed

\* Trust

\* Mobile usability

\* Filipino shopping behavior

\* Easy product discovery

\* Easy ordering

\* Clear order status

\* Simple checkout



The target experience should feel familiar to Filipino customers who are accustomed to shopping in:



\* Public markets

\* Supermarkets

\* Grocery stores

\* Convenience stores

\* Online shopping applications



However, Palengkey should retain its own identity.



\---



\# 3. Target Platforms



Build one shared frontend application for:



1\. Web

2\. Android

3\. iOS



Use:



\* React

\* TypeScript

\* Vite

\* Tailwind CSS

\* Capacitor



The primary design target is mobile.



Desktop web should adapt from the mobile-first design rather than being treated as a completely separate application.



\---



\# 4. Core Architecture



Use a feature-oriented architecture.



Recommended structure:



```text

src/

├── assets/

│

├── components/

│   ├── ui/

│   ├── common/

│   ├── forms/

│   ├── layout/

│   └── navigation/

│

├── features/

│   ├── auth/

│   ├── home/

│   ├── categories/

│   ├── products/

│   ├── search/

│   ├── cart/

│   ├── checkout/

│   ├── orders/

│   ├── tracking/

│   ├── notifications/

│   └── profile/

│

├── hooks/

│

├── layouts/

│

├── pages/

│

├── router/

│

├── services/

│   ├── api/

│   ├── auth/

│   ├── products/

│   ├── cart/

│   ├── orders/

│   └── user/

│

├── stores/

│

├── types/

│

├── utils/

│

└── config/

```



Do not create a large collection of unrelated files at the root of `src`.



Keep functionality close to the feature that owns it.



\---



\# 5. Technology Rules



\## Required



Use:



```text

React

TypeScript

Vite

Tailwind CSS

Capacitor

```



Use TypeScript strictly.



Avoid unnecessary JavaScript files.



Prefer:



```text

.ts

.tsx

```



over:



```text

.js

.jsx

```



\---



\# 6. Component Architecture



Build reusable components.



Examples:



```text

Button

Input

SearchBar

ProductCard

CategoryCard

PriceDisplay

QuantitySelector

CartItem

OrderCard

OrderStatus

BottomNavigation

Header

Modal

Drawer

Toast

EmptyState

LoadingState

ErrorState

```



Do not duplicate the same UI implementation across multiple pages.



If the same pattern appears more than once, consider creating a reusable component.



\---



\# 7. Design System



Palengkey should have a consistent visual language.



The design should communicate:



\* Fresh

\* Local

\* Friendly

\* Reliable

\* Convenient

\* Modern



Avoid generic AI-generated SaaS designs.



Avoid excessive:



\* Gradients

\* Glassmorphism

\* Shadows

\* Decorative elements

\* Animations

\* Excessive rounded containers



The UI should look like a real production shopping application.



\---



\# 8. Color Direction



The visual identity should use a fresh market-inspired palette.



Primary direction:



```text

Green

Yellow

White

Neutral gray

Dark text

```



Suggested initial colors:



```text

Primary Green: #2E7D32

Fresh Green: #43A047

Market Yellow: #F9A825

Background: #F8FAF8

Surface: #FFFFFF

Text: #1F2937

Muted Text: #6B7280

Border: #E5E7EB

```



These are starting values.



Do not blindly apply them everywhere.



Create design tokens so they can be changed globally.



\---



\# 9. Typography



Typography must prioritize readability.



Use:



\* Clear hierarchy

\* Large product names

\* Readable prices

\* Strong CTA text

\* Comfortable line spacing



Avoid overly decorative fonts.



The UI must remain readable on small Android devices.



\---



\# 10. Mobile-First Rules



Design for mobile first.



Important requirements:



\* Minimum comfortable touch targets

\* Bottom navigation where appropriate

\* Sticky actions when useful

\* Large search field

\* Easy thumb interaction

\* Minimal typing

\* Clear CTAs

\* Avoid tiny buttons

\* Avoid hover-dependent interactions



Do not design desktop first and simply shrink the interface.



\---



\# 11. Navigation



Customer navigation should be simple.



Possible primary navigation:



```text

Home

Categories

Cart

Orders

Profile

```



Use a bottom navigation pattern on mobile where appropriate.



Desktop may use:



```text

Header

Navigation

Main Content

```



Do not overload navigation with unnecessary items.



\---



\# 12. Home Page



The home page should prioritize shopping.



Potential structure:



```text

Header

↓

Location / delivery information

↓

Search

↓

Categories

↓

Popular Products

↓

Fresh Market Items

↓

Recommended Items

↓

Promotions

↓

Recently Ordered

```



Do not automatically implement every section.



Use only sections that support the product goals.



\---



\# 13. Product Cards



Product cards should clearly communicate:



\* Product image

\* Product name

\* Price

\* Unit

\* Availability

\* Add button



Example:



```text

\[ Product Image ]



Tomato

₱120 / kg



\[ + Add ]

```



Do not make product cards unnecessarily complicated.



\---



\# 14. Product Details



Product detail screens should provide:



\* Product image

\* Product name

\* Price

\* Unit

\* Availability

\* Quantity

\* Description

\* Optional notes

\* Add to cart CTA



Example customer note:



```text

"Please choose ripe tomatoes."

```



The design should make this interaction obvious.



\---



\# 15. Cart



The cart should clearly display:



\* Product

\* Quantity

\* Price

\* Subtotal

\* Delivery fee

\* Estimated total



Use clear hierarchy.



The checkout CTA should be easy to find.



\---



\# 16. Checkout



Checkout should minimize friction.



Potential sections:



```text

Delivery Address

↓

Order Items

↓

Customer Notes

↓

Payment Method

↓

Order Summary

↓

Place Order

```



Do not make checkout unnecessarily long.



\---



\# 17. Orders



Customers should easily understand their order status.



Possible states:



```text

Order Placed

↓

Preparing

↓

Shopping

↓

Packed

↓

Out for Delivery

↓

Delivered

```



Use visual status indicators.



Avoid technical terminology.



\---



\# 18. Search



Search should be fast and forgiving.



Support:



\* Product names

\* Categories

\* Common Filipino shopping terms where applicable



Design for mobile typing.



Show useful empty states.



Example:



```text

No products found.



Try searching for:

"kamatis"

"sibuyas"

"manok"

```



\---



\# 19. Filipino UX



The product is intended for Filipino users.



Avoid overly formal or unnatural language.



Prefer natural wording.



Examples:



Instead of:



```text

Proceed to transaction

```



Use:



```text

Checkout

```



Instead of:



```text

Item successfully added to your shopping basket

```



Use:



```text

Added to cart

```



The UI should remain professional but approachable.



\---



\# 20. API Architecture



The backend is an existing Laravel API.



Never assume an API endpoint exists.



Never invent backend functionality and present it as real.



Use a dedicated API layer.



Example:



```text

services/

└── api/

&#x20;   ├── client.ts

&#x20;   ├── auth.ts

&#x20;   ├── products.ts

&#x20;   ├── cart.ts

&#x20;   ├── orders.ts

&#x20;   └── users.ts

```



API configuration must use environment variables.



Never hardcode production API URLs inside components.



Example:



```text

VITE\_API\_URL

```



\---



\# 21. Authentication



Authentication should be isolated from UI components.



Possible architecture:



```text

auth/

├── auth.service.ts

├── auth.store.ts

├── auth.types.ts

├── ProtectedRoute.tsx

└── LoginForm.tsx

```



Do not store sensitive credentials insecurely.



When implementing mobile authentication, consider secure storage through Capacitor-compatible mechanisms.



\---



\# 22. State Management



Use local component state when appropriate.



Use centralized state only for shared application state.



Potential global state:



```text

Authentication

Cart

User

App configuration

```



Avoid putting every component state into global state.



\---



\# 23. Capacitor



The application should use Capacitor to package the shared React application for Android and iOS.



Expected structure:



```text

Palengkey2.0/

├── src/

├── android/

├── ios/

├── capacitor.config.ts

└── package.json

```



Keep platform-specific code to a minimum.



Prefer shared React functionality.



Only introduce platform-specific behavior when necessary.



\---



\# 24. Responsive Web



The application must support:



```text

Small mobile

Large mobile

Tablet

Laptop

Desktop

Large desktop

```



Do not simply stretch mobile layouts across large screens.



Desktop layouts should use the additional available space intelligently.



\---



\# 25. Accessibility



Every production screen should consider:



\* Semantic HTML

\* Keyboard navigation

\* Screen readers

\* Color contrast

\* Focus states

\* Form labels

\* Accessible buttons

\* Accessible images

\* Error messaging



Do not rely solely on color to communicate status.



\---



\# 26. Loading States



Every asynchronous operation should have an appropriate loading state.



Examples:



```text

Skeleton

Spinner

Progress indicator

Disabled CTA

```



Avoid blank screens while data is loading.



\---



\# 27. Error States



Errors must be understandable to customers.



Avoid exposing:



```text

500 Internal Server Error

AxiosError

GraphQL error

SQLSTATE

```



Instead use customer-friendly messaging.



Example:



```text

Something went wrong.



Please try again.

```



Technical details may be logged separately.



\---



\# 28. Empty States



Create useful empty states.



Examples:



```text

Your cart is empty.



Start shopping and add your favorite market items.

```



```text

No orders yet.



Your orders will appear here once you place one.

```



\---



\# 29. Performance



Optimize for mobile networks.



Use:



\* Lazy loading

\* Code splitting

\* Optimized images

\* Proper caching

\* Minimal dependencies

\* Efficient API calls



Avoid unnecessary API requests.



Do not load large libraries for simple functionality.



\---



\# 30. Security



Never:



\* Hardcode secrets

\* Commit API keys

\* Expose private credentials

\* Store sensitive information in local storage unnecessarily

\* Trust client-side validation alone



Client validation improves UX.



Backend validation remains authoritative.



\---



\# 31. Environment Configuration



Use environment variables.



Example:



```text

.env

.env.development

.env.production

```



Never commit sensitive environment files.



Use:



```text

VITE\_API\_URL

```



for frontend API configuration where appropriate.



\---



\# 32. Code Quality



Code should be:



\* Readable

\* Maintainable

\* Typed

\* Modular

\* Reusable

\* Consistent



Avoid:



\* Giant components

\* Giant files

\* Deeply nested conditional rendering

\* Duplicate logic

\* Magic numbers

\* Hardcoded API URLs

\* Unnecessary abstractions



\---



\# 33. Comments



Do not add comments for obvious code.



Bad:



```text

// Set loading to true

setLoading(true);

```



Good:



```text

// Prevent duplicate checkout requests while payment is being processed.

```



Comments should explain why something exists, not what obvious code does.



\---



\# 34. Error Handling



API operations should consistently handle:



```text

Loading

Success

Error

Empty

Retry

```



Do not silently swallow errors.



\---



\# 35. Forms



Forms should have:



\* Clear labels

\* Validation

\* Error messages

\* Appropriate input types

\* Mobile-friendly controls

\* Clear submit buttons



Do not make customers repeatedly enter information that can be remembered safely.



\---



\# 36. Images



Product images should:



\* Preserve aspect ratio

\* Have appropriate fallback images

\* Use lazy loading when appropriate

\* Avoid layout shifts

\* Provide meaningful alt text



Avoid massive unoptimized images.



\---



\# 37. Animations



Animations should be subtle and purposeful.



Use animation for:



\* Feedback

\* Navigation transitions

\* Cart updates

\* Loading

\* State changes



Do not animate everything.



Respect reduced-motion preferences.



\---



\# 38. Design Review



Before considering a page complete, review:



\### Visual



\* Does it look like a real shopping application?

\* Is the hierarchy clear?

\* Are CTAs obvious?

\* Is spacing consistent?

\* Is the design mobile-friendly?



\### UX



\* Can a customer understand what to do immediately?

\* Can the task be completed with minimal steps?

\* Are errors understandable?



\### Technical



\* Is TypeScript used correctly?

\* Is business logic separated?

\* Are components reusable?

\* Are API calls separated from UI?



\### Accessibility



\* Are labels present?

\* Are buttons accessible?

\* Is contrast sufficient?

\* Can keyboard users navigate?



\---



\# 39. Development Workflow



Before implementing a new feature:



1\. Understand the requirement.

2\. Inspect the existing code.

3\. Identify affected features.

4\. Propose the implementation.

5\. Identify reusable components.

6\. Identify API requirements.

7\. Implement the smallest maintainable solution.

8\. Test the feature.

9\. Review responsive behavior.

10\. Review accessibility.

11\. Refactor duplicated code.



Do not immediately rewrite unrelated code.



\---



\# 40. Before Building Major Features



For major features, first provide:



```text

Feature

Purpose

User Flow

Screens

Components

State

API Requirements

Data Requirements

Mobile Behavior

Desktop Behavior

Potential Risks

```



Wait for approval before making large architectural changes.



\---



\# 41. Do Not Invent Requirements



If information is missing:



\* Identify the missing information.

\* Make a reasonable proposal.

\* Clearly identify assumptions.

\* Ask for confirmation when the decision materially affects architecture or UX.



Never silently invent:



\* API endpoints

\* Database fields

\* Payment behavior

\* Authentication behavior

\* Order statuses

\* Business rules



\---



\# 42. Existing Palengkey Project



There may be an older Palengkey application.



Treat the existing application as a reference.



Do not blindly copy the old frontend.



Use the old application to understand:



\* Existing business rules

\* API behavior

\* Existing features

\* Existing data structures

\* Existing customer flows



Palengkey 2.0 should have a cleaner and more maintainable frontend architecture.



\---



\# 43. Important Development Rule



Do not create the entire application in one step.



Build incrementally.



Recommended order:



```text

1\. Project Foundation

2\. Design System

3\. Navigation

4\. Authentication

5\. Home

6\. Categories

7\. Product Listing

8\. Product Details

9\. Cart

10\. Checkout

11\. Orders

12\. Tracking

13\. Profile

14\. Notifications

15\. API Integration

16\. Capacitor Integration

17\. Android Testing

18\. iOS Testing

19\. Web Testing

20\. Production Optimization

```



\---



\# 44. Initial Instruction



When this skill is loaded into a new Palengkey 2.0 project, do NOT immediately generate the complete application.



First:



1\. Inspect the project.

2\. Identify the current state.

3\. Confirm the installed technologies.

4\. Propose the architecture.

5\. Propose the folder structure.

6\. Propose the design system.

7\. Propose the initial navigation.

8\. Identify dependencies.

9\. Identify risks.

10\. Wait for approval.



The goal is to build Palengkey 2.0 as a production-quality, mobile-first application rather than a quick prototype.



