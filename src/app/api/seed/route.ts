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
  }
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
  }
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