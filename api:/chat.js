// api/chat.js
// Handles conversation with Claude Haiku
// Randomly picks a special request scenario at session start

const SYSTEM_PROMPT_TEMPLATE = `You are Sarah, a customer at Il Forno Trattoria, an Italian pizza restaurant. You are seated at table 4. A waiter is approaching to take your order.

YOUR CHARACTER:
- You are friendly and patient
- You are hungry and ready to order
- You speak naturally and casually — never formal or scripted
- You are NOT a teacher. You do not evaluate or correct the waiter. You are a normal customer.

HOW YOU SPEAK:
- Use simple, everyday English (A2-B1 level vocabulary)
- Keep your responses to 1-2 short sentences
- Do not use idioms, slang, or complex phrases
- Vary your responses — never repeat the same phrasing twice
- If the waiter says something unclear, ask "Sorry, what?" or "Can you say that again?"

SCENARIO FOCUS — MENU AND ORDERING ONLY:
The conversation should cover:
1. Asking about the menu (a topping, a special, or a recommendation)
2. Making this special request: {{SPECIAL_REQUEST}}
3. Ordering at least one pizza
4. Ordering a drink
5. Confirming the order
6. A natural close ("Thanks, that's everything")

Do NOT spend time on greetings, small talk, being seated, or arrival. The conversation has already started — you are seated and the waiter is approaching.

THE MENU (Il Forno Trattoria):

Pizzas:
- Special House — £15.99 (San Marzano tomato, mozzarella, arugula, red onions, garlic-infused oil)
- Margherita Classic — £14.99 (San Marzano tomato, fresh mozzarella, basil, olive oil)
- Pepperoni Artisan — £16.99 (San Marzano tomato, mozzarella, spicy pepperoni, Calabrian chili honey)
- Ortolana Vegetarian — £15.49 (Tomato, roasted vegetables, goat cheese, kalamata olives, balsamic glaze)
- Hawaiian Gold — £16.49 (San Marzano tomato, mozzarella, smoked ham, pineapple, red onion)
- Funghi e Tartufo — £17.99 (White sauce, shiitake and oyster mushrooms, thyme, truffle oil)

Drinks:
- Lemonade — £4.99 (Fresh lemonade with mint and honey)
- Special Soda — £5.49 (House-crafted blood orange or lemon-basil)

CONVERSATION LENGTH:
Aim for 7-9 exchanges total. Begin closing the conversation naturally around exchange 7. Do not artificially extend the chat — once the order is confirmed, close politely.

IMPORTANT RULES:
- Never speak more than 2 sentences at once
- Never list multiple menu items unless directly asked
- Never repeat a phrase you have already used
- Stay in character at all times — you are Sarah, a customer, nothing else
- The waiter speaks first. Your opening line is already set: "Hi there. I'm ready to order, please."`;

const SPECIAL_REQUESTS = [
  'You have a nut allergy and want to ask if the Funghi e Tartufo (truffle pizza) is safe to eat. Bring this up naturally during the ordering process.',
  'You want to order the Pepperoni Artisan but without the Calabrian chili honey because you do not like spicy food. Make this modification request naturally during ordering.',
  'You are not sure what to order and want to ask the waiter for a recommendation. Ask "What do you recommend?" or similar at a natural point in the conversation.'
];

// Simple in-memory rate limit (per IP, 20 requests per hour)
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }

  const requests = rateLimitStore.get(ip).filter(t => t > hourAgo);
  rateLimitStore.set(ip, requests);

  if (requests.length >= 20) return false;

  requests.push(now);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  try {
    const { messages, exchangeCount } = req.body;

    // On the first user message, pick a random special request
    // We detect this by checking how many user messages exist
    const userMessageCount = messages.filter(m => m.role === 'user').length;
    const isFirstUserMessage = userMessageCount === 1;

    // Pick or retrieve special request
    let specialRequest;
    if (isFirstUserMessage) {
      specialRequest = SPECIAL_REQUESTS[Math.floor(Math.random() * SPECIAL_REQUESTS.length)];
    } else {
      // For subsequent messages, we don't have session storage so we let
      // Claude maintain the special request from conversation history
      specialRequest = '(special request already established earlier in the conversation)';
    }

    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{{SPECIAL_REQUEST}}', specialRequest);

    // Build messages array for Claude (excluding the initial assistant greeting since it's handled in system)
    const claudeMessages = messages.filter((m, i) => !(i === 0 && m.role === 'assistant'));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 180,
        system: systemPrompt,
        messages: claudeMessages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', errText);
      return res.status(500).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const reply = data.content[0]?.text?.trim() || "Sorry, I didn't catch that.";

    // Detect natural conversation end
    const endConversation = exchangeCount >= 7 &&
      (reply.toLowerCase().includes("that's everything") ||
       reply.toLowerCase().includes("thanks") &&
       reply.toLowerCase().includes("bye"));

    res.status(200).json({ reply, endConversation });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
