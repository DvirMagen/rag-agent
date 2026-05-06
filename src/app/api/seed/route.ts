import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { ingestDocument } from '@/lib/rag/ingest'
import { NextResponse } from 'next/server'

const NEXTJS_DOCS = [
  {
    title: 'Next.js App Router Introduction',
    source_url: 'https://nextjs.org/docs/app',
    content: `Next.js App Router is a new paradigm for building applications using React's latest features including Server Components, Streaming, and more. The App Router works in a new directory named app alongside the pages directory to allow for incremental adoption.

Server Components: By default, components inside app are React Server Components. This is a performance optimization and allows you to automatically adopt them, and you can also use Client Components.

Routing: Next.js uses a file-system based router where folders are used to define routes. Each folder represents a route segment that maps to a URL segment. To create a nested route, you can nest folders inside each other.

Layouts: A layout is UI that is shared between multiple pages. On navigation, layouts preserve state, remain interactive, and do not re-render. Layouts can also be nested.

Pages: A page is UI that is unique to a route. You can define pages by exporting a component from a page.js file.`
  },
  {
    title: 'Next.js Data Fetching',
    source_url: 'https://nextjs.org/docs/app/building-your-application/data-fetching',
    content: `Next.js extends the native Web fetch API to allow each request on the server to set its own persistent caching and revalidation semantics.

You can use fetch with async/await in Server Components, in Route Handlers, and in Server Actions.

Caching Data: By default, Next.js automatically caches the returned values of fetch in the Data Cache on the server. This means that the data can be fetched at build time or request time, cached, and reused on each data request.

Revalidating Data: Revalidation is the process of purging the Data Cache and re-fetching the latest data. This is useful when your data changes and you want to ensure you show the latest information.

Time-based revalidation: To revalidate data at a timed interval, you can use the next.revalidate option of fetch to set the cache lifetime of a resource in seconds.

On-demand revalidation: Data can be revalidated on-demand by path using revalidatePath or by cache tag using revalidateTag.`
  },
  {
    title: 'Next.js Server Actions',
    source_url: 'https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions',
    content: `Server Actions are asynchronous functions that are executed on the server. They can be used in Server and Client Components to handle form submissions and data mutations in Next.js applications.

A Server Action can be defined with the React "use server" directive. You can place the directive at the top of an async function to mark the function as a Server Action, or at the top of a separate file to mark all exports of that file as Server Actions.

Server Actions can be invoked using the action attribute in a form element. Server Components support progressive enhancement by default, meaning the form will be submitted even if JavaScript hasn't loaded yet or is disabled.

Server Actions integrate deeply with the Next.js caching and revalidation architecture. When an action is invoked, Next.js can return both the updated UI and new data in a single server roundtrip.`
  },
  {
    title: 'Next.js Authentication',
    source_url: 'https://nextjs.org/docs/app/building-your-application/authentication',
    content: `Authentication verifies a user's identity. Authorization controls what a user can access. Next.js supports multiple authentication patterns.

Route Handlers can be used to handle authentication logic. Session management can be implemented using cookies or database sessions.

Middleware can be used to redirect users based on their authentication status. You can check for session cookies and redirect to login pages for protected routes.

NextAuth.js is a popular authentication library for Next.js that supports many providers including OAuth providers like Google and GitHub, as well as email and credentials authentication.

For protecting API routes, you should verify the user's session in each Route Handler. You can use cookies to store session tokens and verify them on each request.`
  },
  {
    title: 'Next.js Performance Optimization',
    source_url: 'https://nextjs.org/docs/app/building-your-application/optimizing',
    content: `Next.js comes with a variety of built-in optimizations designed to improve your application's speed and Core Web Vitals.

Image Optimization: The Next.js Image component extends the HTML img element with features for automatic image optimization including size optimization, visual stability, faster page loads, and asset flexibility.

Font Optimization: next/font will automatically optimize your fonts and remove external network requests for improved privacy and performance. It includes built-in automatic self-hosting for any font file.

Script Optimization: The Next.js Script component extends the HTML script element and gives you control over when to load and execute scripts.

Lazy Loading: Lazy loading in Next.js helps improve the initial loading performance of an application by decreasing the amount of JavaScript needed to render a route. It allows you to defer loading of Client Components and imported libraries.`
  }, 
  {
    title: 'Next.js Middleware',
    source_url: 'https://nextjs.org/docs/app/building-your-application/routing/middleware',
    content: `Middleware allows you to run code before a request is completed. Then, based on the incoming request, you can modify the response by rewriting, redirecting, modifying the request or response headers, or responding directly.

Middleware runs before cached content and routes are matched. Use the file middleware.ts at the root of your project to define Middleware.

Matching Paths: Middleware will be invoked for every route in your project by default. You can use the matcher config option to precisely target or exclude specific routes.

The matcher allows you to filter Middleware to run on specific paths. You can match a single path, multiple paths, or use regex patterns.

Common use cases for Middleware include authentication and authorization, server-side redirects, path rewriting, bot detection, logging, and feature flags.

Middleware executes in the Edge Runtime by default, which means it runs close to the user for low latency. This makes it ideal for tasks that need to run on every request.`
  },
  {
    title: 'Next.js Error Handling',
    source_url: 'https://nextjs.org/docs/app/building-your-application/routing/error-handling',
    content: `The error.js file convention allows you to gracefully handle unexpected runtime errors in nested routes. It automatically wraps a route segment and its nested children in a React Error Boundary.

Create error UI tailored to specific segments using the file-system hierarchy to adjust granularity. Error components must be Client Components.

The error component receives the error object and a reset function. Calling reset attempts to recover from the error by re-rendering the error boundary's contents.

Global errors: While less common, you can handle errors in the root layout using app/global-error.js. The global error UI must define its own html and body tags since it is replacing the root layout when active.

Not Found: The notFound function allows you to render the not-found.js file within a route segment. This is useful for handling 404 errors gracefully in your application.`
  },
  {
    title: 'Next.js Static and Dynamic Rendering',
    source_url: 'https://nextjs.org/docs/app/building-your-application/rendering',
    content: `Next.js has two rendering environments: the client and the server. Rendering work can be split by route segments to enable streaming and partial rendering.

Static Rendering (Default): Routes are rendered at build time, or in the background after data revalidation. The result is cached and can be pushed to a CDN. This optimization allows you to share the result of the rendering work between users and server requests.

Dynamic Rendering: Routes are rendered for each user at request time. Dynamic rendering is useful when a route has data that is personalized to the user or has information that can only be known at request time, such as cookies or the URL's search params.

Streaming: Streaming enables you to progressively render UI from the server. Work is split into chunks and streamed to the client as it becomes ready. This allows the user to see parts of the page immediately, before the entire content has finished rendering.

React Suspense: You can use Suspense to show a loading state while streaming content. Wrap your component in a Suspense boundary with a fallback UI to show while the content is loading.`
  },
  {
    title: 'Next.js Caching',
    source_url: 'https://nextjs.org/docs/app/building-your-application/caching',
    content: `Next.js improves your application's performance and reduces costs by caching rendering work and data requests. By default, Next.js will cache as much as possible to improve performance and reduce cost.

Request Memoization: React extends the fetch API to automatically memoize requests that have the same URL and options. This means you can call a fetch function for the same data in multiple places in a React component tree while only executing it once.

Data Cache: Next.js has a built-in Data Cache that persists the results of data fetches across incoming server requests and deployments. This is possible because Next.js extends the native fetch API to allow each request on the server to set its own persistent caching semantics.

Full Route Cache: Next.js automatically renders and caches routes at build time. This is an optimization that allows you to serve the cached route instead of rendering on the server for every request.

Router Cache: Next.js has an in-memory client-side router cache that stores the React Server Component payload, split by individual route segments, for the duration of a user session.`
  },
  {
    title: 'Next.js TypeScript Support',
    source_url: 'https://nextjs.org/docs/app/building-your-application/configuring/typescript',
    content: `Next.js provides a TypeScript-first development experience for building your React application. It comes with built-in TypeScript support for automatically installing the necessary packages and configuring the proper settings.

Next.js includes a custom TypeScript plugin and type checker which VSCode and other code editors can use for advanced type-checking and auto-completion.

Statically typed links: Next.js can statically type links to prevent typos and other errors when using next/link. To opt into this feature, experimental.typedRoutes needs to be enabled.

End-to-end type safety: The Next.js App Router has enhanced type safety. This includes type-safe fetch, type-safe route parameters, and type-safe search parameters.

TypeScript configuration: Next.js supports both strict and non-strict TypeScript configurations. The tsconfig.json file in your project controls the TypeScript compiler options.`
  },
  {
    title: 'Next.js Environment Variables',
    source_url: 'https://nextjs.org/docs/app/building-your-application/configuring/environment-variables',
    content: `Next.js comes with built-in support for environment variables, which allows you to load environment variables from .env files and expose them to the browser.

Loading Environment Variables: Next.js loads environment variables from .env.local into process.env automatically. Only variables prefixed with NEXT_PUBLIC_ are exposed to the browser.

Environment variable files: .env loads in all environments, .env.local loads in all environments and is git ignored, .env.development loads only in development, .env.production loads only in production.

Test Environment Variables: For testing environments, you can use .env.test which is loaded when the NODE_ENV is set to test.

Exposing variables to the browser: By default, environment variables are only available in the Node.js environment. To expose a variable to the browser, prefix it with NEXT_PUBLIC_.

Runtime configuration: For dynamic configuration that changes at runtime, you can use the runtime config feature or environment variables set at deployment time through your hosting provider.`
  },
  {
    title: 'Next.js Metadata and SEO',
    source_url: 'https://nextjs.org/docs/app/building-your-application/optimizing/metadata',
    content: `Next.js has a Metadata API that can be used to define your application metadata for improved SEO and web shareability.

Static metadata: To define static metadata, export a Metadata object from a layout or page file. Next.js will automatically add the appropriate meta tags to the HTML head.

Dynamic metadata: You can use the generateMetadata function to fetch metadata that requires dynamic values. This function receives the route params and parent metadata.

File-based metadata: Next.js supports special files for metadata including favicon.ico, apple-icon.jpg, robots.txt, and sitemap.xml. These files are automatically used by Next.js.

Open Graph: Next.js supports Open Graph metadata for social media sharing. You can define og:title, og:description, og:image and other Open Graph properties through the metadata object.

Twitter Cards: Similar to Open Graph, Next.js supports Twitter Card metadata for rich previews on Twitter. Define twitter:card, twitter:title, twitter:description and twitter:image in your metadata.`
  },
  {
    title: 'Next.js API Routes and Route Handlers',
    source_url: 'https://nextjs.org/docs/app/building-your-application/routing/route-handlers',
    content: `Route Handlers allow you to create custom request handlers for a given route using the Web Request and Response APIs. Route Handlers are defined in a route.js or route.ts file inside the app directory.

Supported HTTP Methods: Route Handlers support GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS HTTP methods.

Caching: Route Handlers are not cached by default. You can opt into caching for GET methods by using the dynamic configuration option.

Cookies: You can read and set cookies from Route Handlers using the cookies function from next/headers or through the Response object.

Headers: You can read incoming request headers using the headers function from next/headers. You can also set response headers using the NextResponse object.

Redirects: You can redirect from Route Handlers using the redirect function from next/navigation or by returning a Response with a 301 or 302 status code.

Dynamic Route Segments: Route Handlers can use Dynamic Segments to create request handlers from dynamic data.`
  },
  {
    title: 'Next.js Deployment and Production',
    source_url: 'https://nextjs.org/docs/app/building-your-application/deploying',
    content: `Next.js can be deployed to any hosting provider that supports Node.js. The recommended deployment platform is Vercel, which is built by the Next.js team.

Vercel deployment: Deploying to Vercel is zero-config for Next.js projects. Connect your GitHub repository and Vercel will automatically deploy your application on every push.

Self-hosting: You can self-host Next.js on any server that supports Node.js. Run next build to create an optimized production build, then next start to start the production server.

Static exports: Next.js allows you to export your app as a static HTML/CSS/JS bundle that can be deployed to any web server without Node.js.

Docker: Next.js can be containerized using Docker. The Next.js repository includes a Dockerfile example for production deployments.

Environment variables: Set environment variables in your hosting provider's dashboard for production. Never commit sensitive environment variables to your repository.

Edge deployment: Next.js supports deploying to edge networks for improved performance. Middleware and Edge API Routes run on the edge runtime.`
  },
  {
    title: 'Next.js Testing',
    source_url: 'https://nextjs.org/docs/app/building-your-application/testing',
    content: `Next.js supports multiple testing frameworks including Vitest, Jest, Playwright, and Cypress. Each serves different testing needs.

  Unit testing with Vitest: Vitest is a fast unit test framework with native ESM support. It works well with Next.js for testing utility functions, hooks, and components in isolation.

  Unit testing with Jest: Jest is the most popular JavaScript testing framework. Next.js includes a Jest configuration that handles the App Router, including transforming Server Components.

  End-to-end testing with Playwright: Playwright is an end-to-end testing framework that lets you test your Next.js app in real browsers including Chromium, Firefox, and WebKit.

  End-to-end testing with Cypress: Cypress is another popular end-to-end testing framework with a visual test runner that makes debugging tests easy.

  Testing Server Components: Server Components cannot be tested with traditional React testing utilities. You can test them by rendering them server-side and checking the HTML output.

  Mocking: When testing components that use Next.js features like useRouter or useSearchParams, you'll need to mock these modules in your tests.`
    },
]

const COOKING_DOCS = [
  {
    title: 'Introduction to French Cuisine',
    source_url: 'https://cooking-course.example.com/french-intro',
    content: `French cuisine is one of the most celebrated culinary traditions in the world. It is characterized by its refined techniques, high-quality ingredients, and complex flavors.

The foundation of French cooking lies in its classic sauces. The five mother sauces are Béchamel, Velouté, Espagnole, Sauce Tomat, and Hollandaise. These form the basis of countless other sauces used in French cuisine.

Mise en place is a fundamental concept in French cooking that means "everything in its place." Before cooking, chefs prepare and organize all ingredients and equipment needed for a recipe.

French cooking techniques include sautéing, braising, roasting, and poaching. Each technique brings out different flavors and textures in ingredients.

Classic French dishes include Coq au Vin, Beef Bourguignon, Ratatouille, Bouillabaisse, and Crème Brûlée. These dishes showcase the depth and sophistication of French culinary tradition.`
  },
  {
    title: 'Knife Skills and Kitchen Safety',
    source_url: 'https://cooking-course.example.com/knife-skills',
    content: `Proper knife skills are essential for any cook. Good knife technique improves efficiency, consistency, and safety in the kitchen.

The chef's knife is the most versatile knife in the kitchen. It can be used for chopping, slicing, dicing, and mincing. A good chef's knife should feel balanced and comfortable in your hand.

Basic cuts include the julienne (thin matchstick strips), brunoise (tiny cubes from julienne), dice (small, medium, or large cubes), and chiffonade (thin ribbons of leafy herbs or vegetables).

The pinch grip is the safest and most controlled way to hold a knife. Pinch the blade between your thumb and forefinger right where the blade meets the handle, and wrap your other fingers around the handle.

Always keep knives sharp. A dull knife requires more force and is more likely to slip. Sharpen knives regularly using a whetstone or honing steel.

Kitchen safety rules: always cut away from your body, keep your cutting board stable with a damp towel underneath, curl your fingers into a claw shape to protect them while cutting.`
  },
  {
    title: 'Baking Fundamentals',
    source_url: 'https://cooking-course.example.com/baking',
    content: `Baking is a science that requires precision and understanding of how ingredients interact. Unlike cooking, where you can often improvise, baking requires careful measurement and technique.

Flour provides structure to baked goods through the development of gluten. Different types of flour have different protein content, which affects gluten development. All-purpose flour is the most versatile, while bread flour has higher protein for chewy breads and cake flour is lower protein for tender cakes.

Leavening agents make baked goods rise. Baking powder contains both an acid and a base and creates bubbles when moistened and heated. Baking soda requires an acid in the recipe to activate. Yeast is a living organism that produces carbon dioxide through fermentation.

Fat in baking provides flavor, tenderness, and moisture. Butter adds rich flavor and creates flaky layers in pastry. Oil creates a moist, tender crumb in cakes.

Sugar does more than sweeten: it helps with browning through caramelization and Maillard reaction, retains moisture, and provides tenderness by inhibiting gluten development.

Common baking mistakes include overmixing (develops too much gluten), incorrect oven temperature, opening the oven door too early, and not measuring ingredients accurately.`
  },
  {
    title: 'Understanding Flavor Profiles',
    source_url: 'https://cooking-course.example.com/flavor',
    content: `Flavor is a complex combination of taste, aroma, and texture. Understanding how flavors work together is key to becoming a skilled cook.

The five basic tastes are sweet, sour, salty, bitter, and umami. Umami is often described as a savory, meaty taste found in foods like mushrooms, parmesan cheese, tomatoes, and soy sauce.

Balancing flavors is about creating harmony. If a dish is too sour, add sweetness. If it is too bland, add salt or acid. Acid from lemon juice or vinegar can brighten and lift flavors in a dish.

Herbs and spices add complexity to dishes. Fresh herbs like basil, parsley, and cilantro are best added at the end of cooking to preserve their volatile aromatic compounds. Dried spices are better added earlier to allow their flavors to bloom.

The Maillard reaction is a chemical reaction between amino acids and sugars that creates the brown crust and complex flavors in seared meat, toasted bread, and roasted coffee.

Layering flavors means building complexity by adding ingredients at different stages of cooking. Starting with aromatics like onion and garlic, then adding proteins and vegetables, and finishing with fresh herbs and acid creates depth of flavor.`
  },
  {
    title: 'Pasta Making from Scratch',
    source_url: 'https://cooking-course.example.com/pasta',
    content: `Making fresh pasta from scratch is a rewarding skill that produces superior results compared to dried pasta. Fresh pasta has a delicate texture and rich egg flavor that pairs beautifully with cream-based and butter-based sauces.

The basic fresh pasta recipe uses 00 flour and eggs. 00 flour is finely milled Italian flour that creates silky smooth pasta. For every 100 grams of flour, use one large egg. This ratio can be adjusted based on humidity and egg size.

To make pasta dough: mound the flour on a clean surface, create a well in the center, crack eggs into the well, and gradually incorporate the flour with a fork. Once a shaggy dough forms, knead by hand for 8-10 minutes until smooth and elastic. Wrap in plastic and rest for 30 minutes.

Rolling pasta by hand requires a long rolling pin and patience. Roll from the center outward, rotating the dough frequently. Machine rolling is more consistent: start at the widest setting and progressively roll thinner.

Different pasta shapes suit different sauces. Thin pastas like angel hair suit light oil-based sauces. Ribbon pastas like tagliatelle suit meat ragù. Tube shapes like rigatoni hold chunky sauces in their ridges.

Cooking fresh pasta takes only 2-3 minutes in well-salted boiling water. The water should taste like the sea. Reserve pasta water before draining as the starchy water helps emulsify and thicken sauces.`
  }, 
  {
    title: 'Next.js Middleware',
    source_url: 'https://nextjs.org/docs/app/building-your-application/routing/middleware',
    content: `Middleware allows you to run code before a request is completed. Then, based on the incoming request, you can modify the response by rewriting, redirecting, modifying the request or response headers, or responding directly.

Middleware runs before cached content and routes are matched. Use the file middleware.ts at the root of your project to define Middleware.

Matching Paths: Middleware will be invoked for every route in your project by default. You can use the matcher config option to precisely target or exclude specific routes.

The matcher allows you to filter Middleware to run on specific paths. You can match a single path, multiple paths, or use regex patterns.

Common use cases for Middleware include authentication and authorization, server-side redirects, path rewriting, bot detection, logging, and feature flags.

Middleware executes in the Edge Runtime by default, which means it runs close to the user for low latency. This makes it ideal for tasks that need to run on every request.`
  },
  {
    title: 'Next.js Error Handling',
    source_url: 'https://nextjs.org/docs/app/building-your-application/routing/error-handling',
    content: `The error.js file convention allows you to gracefully handle unexpected runtime errors in nested routes. It automatically wraps a route segment and its nested children in a React Error Boundary.

Create error UI tailored to specific segments using the file-system hierarchy to adjust granularity. Error components must be Client Components.

The error component receives the error object and a reset function. Calling reset attempts to recover from the error by re-rendering the error boundary's contents.

Global errors: While less common, you can handle errors in the root layout using app/global-error.js. The global error UI must define its own html and body tags since it is replacing the root layout when active.

Not Found: The notFound function allows you to render the not-found.js file within a route segment. This is useful for handling 404 errors gracefully in your application.`
  },
  {
    title: 'Next.js Static and Dynamic Rendering',
    source_url: 'https://nextjs.org/docs/app/building-your-application/rendering',
    content: `Next.js has two rendering environments: the client and the server. Rendering work can be split by route segments to enable streaming and partial rendering.

Static Rendering (Default): Routes are rendered at build time, or in the background after data revalidation. The result is cached and can be pushed to a CDN. This optimization allows you to share the result of the rendering work between users and server requests.

Dynamic Rendering: Routes are rendered for each user at request time. Dynamic rendering is useful when a route has data that is personalized to the user or has information that can only be known at request time, such as cookies or the URL's search params.

Streaming: Streaming enables you to progressively render UI from the server. Work is split into chunks and streamed to the client as it becomes ready. This allows the user to see parts of the page immediately, before the entire content has finished rendering.

React Suspense: You can use Suspense to show a loading state while streaming content. Wrap your component in a Suspense boundary with a fallback UI to show while the content is loading.`
  },
  {
    title: 'Next.js Caching',
    source_url: 'https://nextjs.org/docs/app/building-your-application/caching',
    content: `Next.js improves your application's performance and reduces costs by caching rendering work and data requests. By default, Next.js will cache as much as possible to improve performance and reduce cost.

Request Memoization: React extends the fetch API to automatically memoize requests that have the same URL and options. This means you can call a fetch function for the same data in multiple places in a React component tree while only executing it once.

Data Cache: Next.js has a built-in Data Cache that persists the results of data fetches across incoming server requests and deployments. This is possible because Next.js extends the native fetch API to allow each request on the server to set its own persistent caching semantics.

Full Route Cache: Next.js automatically renders and caches routes at build time. This is an optimization that allows you to serve the cached route instead of rendering on the server for every request.

Router Cache: Next.js has an in-memory client-side router cache that stores the React Server Component payload, split by individual route segments, for the duration of a user session.`
  },
  {
    title: 'Next.js TypeScript Support',
    source_url: 'https://nextjs.org/docs/app/building-your-application/configuring/typescript',
    content: `Next.js provides a TypeScript-first development experience for building your React application. It comes with built-in TypeScript support for automatically installing the necessary packages and configuring the proper settings.

Next.js includes a custom TypeScript plugin and type checker which VSCode and other code editors can use for advanced type-checking and auto-completion.

Statically typed links: Next.js can statically type links to prevent typos and other errors when using next/link. To opt into this feature, experimental.typedRoutes needs to be enabled.

End-to-end type safety: The Next.js App Router has enhanced type safety. This includes type-safe fetch, type-safe route parameters, and type-safe search parameters.

TypeScript configuration: Next.js supports both strict and non-strict TypeScript configurations. The tsconfig.json file in your project controls the TypeScript compiler options.`
  },
  {
    title: 'Next.js Environment Variables',
    source_url: 'https://nextjs.org/docs/app/building-your-application/configuring/environment-variables',
    content: `Next.js comes with built-in support for environment variables, which allows you to load environment variables from .env files and expose them to the browser.

Loading Environment Variables: Next.js loads environment variables from .env.local into process.env automatically. Only variables prefixed with NEXT_PUBLIC_ are exposed to the browser.

Environment variable files: .env loads in all environments, .env.local loads in all environments and is git ignored, .env.development loads only in development, .env.production loads only in production.

Test Environment Variables: For testing environments, you can use .env.test which is loaded when the NODE_ENV is set to test.

Exposing variables to the browser: By default, environment variables are only available in the Node.js environment. To expose a variable to the browser, prefix it with NEXT_PUBLIC_.

Runtime configuration: For dynamic configuration that changes at runtime, you can use the runtime config feature or environment variables set at deployment time through your hosting provider.`
  },
  {
    title: 'Next.js Metadata and SEO',
    source_url: 'https://nextjs.org/docs/app/building-your-application/optimizing/metadata',
    content: `Next.js has a Metadata API that can be used to define your application metadata for improved SEO and web shareability.

Static metadata: To define static metadata, export a Metadata object from a layout or page file. Next.js will automatically add the appropriate meta tags to the HTML head.

Dynamic metadata: You can use the generateMetadata function to fetch metadata that requires dynamic values. This function receives the route params and parent metadata.

File-based metadata: Next.js supports special files for metadata including favicon.ico, apple-icon.jpg, robots.txt, and sitemap.xml. These files are automatically used by Next.js.

Open Graph: Next.js supports Open Graph metadata for social media sharing. You can define og:title, og:description, og:image and other Open Graph properties through the metadata object.

Twitter Cards: Similar to Open Graph, Next.js supports Twitter Card metadata for rich previews on Twitter. Define twitter:card, twitter:title, twitter:description and twitter:image in your metadata.`
  },
  {
    title: 'Next.js API Routes and Route Handlers',
    source_url: 'https://nextjs.org/docs/app/building-your-application/routing/route-handlers',
    content: `Route Handlers allow you to create custom request handlers for a given route using the Web Request and Response APIs. Route Handlers are defined in a route.js or route.ts file inside the app directory.

Supported HTTP Methods: Route Handlers support GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS HTTP methods.

Caching: Route Handlers are not cached by default. You can opt into caching for GET methods by using the dynamic configuration option.

Cookies: You can read and set cookies from Route Handlers using the cookies function from next/headers or through the Response object.

Headers: You can read incoming request headers using the headers function from next/headers. You can also set response headers using the NextResponse object.

Redirects: You can redirect from Route Handlers using the redirect function from next/navigation or by returning a Response with a 301 or 302 status code.

Dynamic Route Segments: Route Handlers can use Dynamic Segments to create request handlers from dynamic data.`
  },
  {
    title: 'Next.js Deployment and Production',
    source_url: 'https://nextjs.org/docs/app/building-your-application/deploying',
    content: `Next.js can be deployed to any hosting provider that supports Node.js. The recommended deployment platform is Vercel, which is built by the Next.js team.

Vercel deployment: Deploying to Vercel is zero-config for Next.js projects. Connect your GitHub repository and Vercel will automatically deploy your application on every push.

Self-hosting: You can self-host Next.js on any server that supports Node.js. Run next build to create an optimized production build, then next start to start the production server.

Static exports: Next.js allows you to export your app as a static HTML/CSS/JS bundle that can be deployed to any web server without Node.js.

Docker: Next.js can be containerized using Docker. The Next.js repository includes a Dockerfile example for production deployments.

Environment variables: Set environment variables in your hosting provider's dashboard for production. Never commit sensitive environment variables to your repository.

Edge deployment: Next.js supports deploying to edge networks for improved performance. Middleware and Edge API Routes run on the edge runtime.`
  },
  {
    title: 'Next.js Testing',
    source_url: 'https://nextjs.org/docs/app/building-your-application/testing',
    content: `Next.js supports multiple testing frameworks including Vitest, Jest, Playwright, and Cypress. Each serves different testing needs.

Unit testing with Vitest: Vitest is a fast unit test framework with native ESM support. It works well with Next.js for testing utility functions, hooks, and components in isolation.

Unit testing with Jest: Jest is the most popular JavaScript testing framework. Next.js includes a Jest configuration that handles the App Router, including transforming Server Components.

End-to-end testing with Playwright: Playwright is an end-to-end testing framework that lets you test your Next.js app in real browsers including Chromium, Firefox, and WebKit.

End-to-end testing with Cypress: Cypress is another popular end-to-end testing framework with a visual test runner that makes debugging tests easy.

Testing Server Components: Server Components cannot be tested with traditional React testing utilities. You can test them by rendering them server-side and checking the HTML output.

Mocking: When testing components that use Next.js features like useRouter or useSearchParams, you'll need to mock these modules in your tests.`
  },
]

export async function POST(request: Request) {
  const { secret } = await request.json()

  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const foundA = existingUsers?.users?.find(u => u.email === 'nextjs@demo.com')
    const foundB = existingUsers?.users?.find(u => u.email === 'cooking@demo.com')

    let userAId: string
    let userBId: string

    if (foundA) {
      userAId = foundA.id
    } else {
      const { data: userA } = await supabase.auth.admin.createUser({
        email: 'nextjs@demo.com',
        password: 'demo1234',
        email_confirm: true,
      })
      userAId = userA.user!.id
    }

    if (foundB) {
      userBId = foundB.id
    } else {
      const { data: userB } = await supabase.auth.admin.createUser({
        email: 'cooking@demo.com',
        password: 'demo1234',
        email_confirm: true,
      })
      userBId = userB.user!.id
    }

    // Clear existing docs for these users
    await supabase.from('documents').delete().eq('user_id', userAId)
    await supabase.from('documents').delete().eq('user_id', userBId)

    // Seed User A docs
    for (const doc of NEXTJS_DOCS) {
      await ingestDocument(userAId, doc.title, doc.content, doc.source_url)
    }

    // Seed User B docs
    for (const doc of COOKING_DOCS) {
      await ingestDocument(userBId, doc.title, doc.content, doc.source_url)
    }

    return NextResponse.json({
      success: true,
      message: 'Seeded 2 users with knowledge bases',
      users: {
        nextjs: 'nextjs@demo.com / demo1234',
        cooking: 'cooking@demo.com / demo1234',
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}