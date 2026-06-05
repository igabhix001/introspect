interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions";
const MODEL_SMALL = "kimi-k2.5";
const MODEL_COMPLEX = "kimi-k2.6";

async function callKimi(
  messages: ChatMessage[],
  model = MODEL_COMPLEX,
  maxTokens = 1000
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const apiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
  if (!apiKey) {
    console.warn("Kimi API key not configured. Falling back to rule-based analysis.");
    throw new Error("API_KEY_MISSING");
  }

  try {
    const res = await fetch(KIMI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.3
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;

    return { content, promptTokens, completionTokens };
  } catch (error) {
    console.error("Kimi API call failed:", error);
    throw error;
  }
}

/**
 * Generates an End-of-Day coaching narrative using Kimi 2.6.
 */
export async function generateCoachingNarrative(data: {
  tradesCount: number;
  totalPnl: number;
  rulesFollowed: number;
  totalRules: number;
  mistakesCount: number;
  mistakeTags: string[];
  emotions: string[];
  notes: string[];
}): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const systemPrompt = `You are INTROSPECT™, an elite trading psychology coach and behavioral therapist. Your goal is to help traders understand their execution mistakes and emotional leaks.
You speak with clinical authority, empathy, and absolute directness. Do not sound like generic AI (avoid phrases like "As an AI...", "It's important to remember...", or overly cheerful greetings). Do not output bulleted summaries of what the user already knows. Instead, provide deep cognitive synthesis.

Analyze the trader's daily performance data:
- Number of trades: ${data.tradesCount}
- P&L: ₹${data.totalPnl.toLocaleString("en-IN")}
- Rules Followed: ${data.rulesFollowed}/${data.totalRules}
- Mistakes Count: ${data.mistakesCount}
- Logged Mistakes: ${data.mistakeTags.join(", ")}
- Emotions Logged: ${data.emotions.join(", ")}
- Trade Notes: ${data.notes.join(" | ")}

In your response, write exactly three concise paragraphs:
1. **Behavioral Synthesis**: Diagnose the trader's emotional state and execution quality today. Directly map their mistakes (like FOMO or revenge trading) to cognitive biases (e.g., Loss Aversion, Recency Bias, Action Bias, or Overconfidence). Explain the "why" behind their actions.
2. **Cognitive Reframe**: Challenge their underlying assumptions. Help them reframe their emotional triggers (e.g. fear of missing out, anger after a loss) into professional trading concepts.
3. **Prescriptive Rules**: Dictate 2-3 highly specific, concrete rules for tomorrow based ONLY on today's mistakes (e.g., "Set a hard stop after 2 consecutive losses," "Limit size to 50% for the first hour"). Do not write generic advice.

Format your response in plain text with clear paragraph breaks.`;

  try {
    return await callKimi([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate today's EOD coaching narrative." }
    ], MODEL_COMPLEX, 1000);
  } catch (err) {
    // Return rule-based fallback if API fails
    return {
      content: getFallbackNarrative(data),
      promptTokens: 0,
      completionTokens: 0
    };
  }
}

/**
 * Generates interactive reflection feedback based on a CBT coaching loop.
 */
export async function generateReflectionFeedback(
  mistakeType: string,
  userReflection: string
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const systemPrompt = `You are INTROSPECT™ Cognitive Reflection Coach. A trader has committed a '${mistakeType}' mistake and provided their personal reflection.
Provide a direct, constructive feedback using Cognitive Behavioral Therapy (CBT) principles. 
Acknowledge their honesty, identify any cognitive distortions in their reflection (e.g. catastrophizing, emotional reasoning, or illusion of control), and give them one actionable rule or practice to implement immediately.
Keep your response concise, under 150 words. Avoid generic pleasantries.`;

  try {
    return await callKimi([
      { role: "system", content: systemPrompt },
      { role: "user", content: `My mistake: ${mistakeType}\nMy reflection: "${userReflection}"` }
    ], MODEL_SMALL, 400);
  } catch (err) {
    return {
      content: `Coaching Feedback: It takes courage to acknowledge a ${mistakeType} deviation. You recognized that emotional pressure drove this trade. For your next session, implement a pre-entry checklist: before clicking buy or sell, wait 10 seconds to confirm if it aligns with your exact plan. Capital preservation is your only priority.`,
      promptTokens: 0,
      completionTokens: 0
    };
  }
}

/**
 * Rule-based fallback generator for EOD Coaching Narrative.
 */
function getFallbackNarrative(data: {
  tradesCount: number;
  totalPnl: number;
  rulesFollowed: number;
  totalRules: number;
  mistakesCount: number;
  mistakeTags: string[];
  emotions: string[];
}): string {
  const isLoss = data.totalPnl < 0;
  const hasMistakes = data.mistakesCount > 0;
  
  let paragraph1 = "";
  let paragraph2 = "";
  let paragraph3 = "";

  if (hasMistakes) {
    const list = data.mistakeTags.map(m => m.replace(/^🔴\s*/, "")).join(" and ");
    paragraph1 = `Today's execution was characterized by a clear struggle with ${list || "discipline"}. The presence of emotions like ${data.emotions.join(", ") || "uncertainty"} suggests that market movements triggered cognitive biases—specifically Loss Aversion or Recency Bias. This led you to override your predefined execution structure, turning calculated risk into emotional gambling.`;
    
    paragraph2 = `To break this cycle, you must realize that losing trades are not personal failures; they are the cost of doing business. Emotional urgency to recover losses or chase moves stems from a lack of acceptance of market random outcomes. Refocus on executing the process, not chasing P&L.`;
    
    paragraph3 = `Tomorrow's Prescriptive Rules:\n1. Stop trading immediately after 2 consecutive losses to prevent revenge trading.\n2. Do not enter any trade without a predefined, hard stop-loss registered in the system.\n3. Restrict trading size to 50% of your standard capital until discipline is restored.`;
  } else if (isLoss) {
    paragraph1 = `Despite ending the day with a loss of ₹${Math.abs(data.totalPnl).toLocaleString("en-IN")}, your execution was highly disciplined. You followed ${data.rulesFollowed} of your ${data.totalRules} rules and avoided trading mistakes. This represents professional-grade loss acceptance, containing the drawdowns cleanly.`;
    
    paragraph2 = `Remember that in trading, you can do everything right and still lose money on individual trades. Your discipline under drawdown is the single factor that ensures long-term survival. Accept this loss as a minor premium paid for market participation.`;
    
    paragraph3 = `Tomorrow's Prescriptive Rules:\n1. Maintain your exact position sizing rules.\n2. Keep executing high-probability setups without hesitation.\n3. Stick to your daily risk limits.`;
  } else {
    paragraph1 = `Congratulations on an elite execution day. You followed all rules perfectly and logged a profit of ₹${data.totalPnl.toLocaleString("en-IN")} with zero mistakes. Your emotional state remained calm and steady, showcasing the Structured Executor archetype.`;
    
    paragraph2 = `The main danger after a perfect trading day is Overconfidence Bias. When wins accumulate, the brain naturally starts to view rules as flexible guidelines. Stay vigilant against the urge to increase size or take sub-optimal setups tomorrow.`;
    
    paragraph3 = `Tomorrow's Prescriptive Rules:\n1. Keep position size identical to today—do not increase size.\n2. Maintain your pre-trade checklist rules.\n3. Walk away as soon as your daily target is achieved.`;
  }

  return `${paragraph1}\n\n${paragraph2}\n\n${paragraph3}`;
}

/**
 * Generates an AI Psychological Profiler report based on the diagnostic questions.
 */
export async function generateAssessmentAiProfile(
  answers: Array<{ question: string; category: string; answer: number }>
): Promise<{
  profile: {
    archetype: string;
    triggers: string[];
    tailRiskScenario: string;
    defensePlan: string[];
  };
  promptTokens: number;
  completionTokens: number;
}> {
  const overallAvg = answers.length > 0 ? answers.reduce((sum, a) => sum + a.answer, 0) / answers.length : 3;
  const allIdentical = answers.every(a => a.answer === answers[0]?.answer);

  if (overallAvg <= 2.2 || overallAvg >= 4.5 || allIdentical) {
    console.log(`[AI Profiler] Edge case detected (avg: ${overallAvg.toFixed(2)}, identical: ${allIdentical}). Routing directly to fallback profile.`);
    return {
      profile: getFallbackAiProfile(answers),
      promptTokens: 0,
      completionTokens: 0
    };
  }

  // Prune prompt payload: group answers by category and format only trimmed category: score mappings
  const categoryScores: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  answers.forEach(a => {
    categoryScores[a.category] = (categoryScores[a.category] || 0) + a.answer;
    categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
  });
  
  const trimmedMappingsStr = Object.entries(categoryScores)
    .map(([cat, score]) => `${cat}: ${Math.round((score / categoryCounts[cat]) * 10) / 10}/5 (1=Strong Discipline, 5=Strong Emotional Dominance)`)
    .join("\n");

  const systemPrompt = `You are INTROSPECT™ AI Psychological Profiler, an elite trading psychology coach and quantitative behavioral analyst.
Analyze the user's category score mappings below and determine their psychological trading archetype, their tilt triggers, their tail-risk scenario, and their customized defense plan.

User Category Scores:
${trimmedMappingsStr}

Based on these ratings, determine:
1. **Trader Archetype**: A unique, professional cognitive personality name (e.g. "The Urgent Fighter", "The Yielding Scalper", "The Hesitant Analyst") and a brief 2-sentence description of their execution styles, strengths, and underlying emotional vulnerabilities.
2. **Tilt Triggers**: Three highly specific behavioral triggers that will cause them to lose discipline (e.g., "Price moving sharply just after market open, provoking FOMO", "A loss after a long winning streak, triggering revenge size-increase").
3. **Tail-Risk Scenario**: A vivid, realistic description of how this user is most likely to blow their account in a single day (their "black swan" behavioral failure mode).
4. **Defense Plan**: Three concrete, non-negotiable rule boundaries to prevent their specific tail-risk scenario.

IMPORTANT: Output ONLY a valid JSON object. Do NOT wrap it in markdown code blocks like \`\`\`json. Do NOT include any extra text before or after the JSON.
The JSON must follow this exact structure:
{
  "archetype": "Archetype Name - Description of style, strengths, and vulnerabilities.",
  "triggers": [
    "Trigger 1...",
    "Trigger 2...",
    "Trigger 3..."
  ],
  "tailRiskScenario": "Vivid description of how they blow their account.",
  "defensePlan": [
    "Rule 1...",
    "Rule 2...",
    "Rule 3..."
  ]
}

Ensure the output is valid, parseable JSON.`;

  try {
    const rawResult = await callKimi([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Analyze my diagnostic results and output my psychological profile." }
    ], MODEL_COMPLEX, 1000);

    const cleanJson = rawResult.content.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const parsedProfile = JSON.parse(cleanJson);
    return {
      profile: parsedProfile,
      promptTokens: rawResult.promptTokens,
      completionTokens: rawResult.completionTokens
    };
  } catch (err) {
    console.error("AI Profiler Kimi call failed, using rule-based fallback:", err);
    return {
      profile: getFallbackAiProfile(answers),
      promptTokens: 0,
      completionTokens: 0
    };
  }
}

/**
 * Generates a high-quality, professional, rule-based fallback AI profile based on answers.
 */
function getFallbackAiProfile(
  answers: Array<{ question: string; category: string; answer: number }>
): {
  archetype: string;
  triggers: string[];
  tailRiskScenario: string;
  defensePlan: string[];
} {
  // Group answers by category
  const categoryScores: Record<string, { total: number; count: number }> = {};
  answers.forEach((a) => {
    if (!categoryScores[a.category]) {
      categoryScores[a.category] = { total: 0, count: 0 };
    }
    categoryScores[a.category].total += a.answer;
    categoryScores[a.category].count += 1;
  });

  // Calculate overall average score (1 to 5 scale)
  const totalSum = answers.reduce((sum, a) => sum + a.answer, 0);
  const overallAvg = answers.length > 0 ? totalSum / answers.length : 3;

  // 1. High discipline case (overallAvg <= 1.5)
  if (overallAvg <= 1.5) {
    return {
      archetype: "The Mechanical Operator - You execute trades with machine-like consistency, adhering strictly to stop-losses and position sizing. Your emotional state remains neutral, allowing you to accept losses as business expenses without tilt.",
      triggers: [
        "Slippage during extremely fast market news events.",
        "A series of random scratches/flat exits that test your execution patience.",
        "System or network issues that interrupt your automated execution path."
      ],
      tailRiskScenario: "You execute a series of perfect trades but get hit by consecutive slippage on flat exits. Frustrated by technical/broker latency rather than the market, you take a trade outside your setup to prove your edge, leading to a minor deviation from your plan.",
      defensePlan: [
        "Define strict maximum slippage limits for your entries and exits.",
        "Have a secondary network/device backup ready for instant order execution.",
        "Review weekly execution quality metrics rather than daily P&L outcomes."
      ]
    };
  }

  // 2. Mostly disciplined case (overallAvg <= 2.2)
  if (overallAvg <= 2.2) {
    return {
      archetype: "The Structured Executor - You have a solid, rule-based approach to trading and respect your stops. You experience occasional emotional interference, but maintain control over execution.",
      triggers: [
        "A trade going slightly green and then reversing to hit your stop-loss.",
        "Missing a major market rally because your entry trigger was not touched.",
        "Entering a trade on a semi-plan setup during high morning volatility."
      ],
      tailRiskScenario: "After a winning trade, you take a slightly wider stop on the next trade because of high confidence. The trade is a loss, wiping out the first win. Stung by the regression, you hesitate on the next setup, missing a high-probability win and leading to minor frustration.",
      defensePlan: [
        "Write down your entry checklist and confirm all criteria before entering.",
        "Enforce a strict maximum loss limit per trade that cannot be adjusted.",
        "Journal your emotional state after any trade that reverses from green to red."
      ]
    };
  }

  // 2.5. Highly volatile case (overallAvg >= 4.5)
  if (overallAvg >= 4.5) {
    return {
      archetype: "The Volatile Rule-Overrider - You have a solid theoretical understanding of risk but override your boundaries when under pressure. You repeatedly commit the same mistakes despite logging and reviewing them, indicating a breakdown in execution control.",
      triggers: [
        "Experiencing a slippage or execution delay that worsens your entry price.",
        "A series of choppy market whipsaws that hit multiple stops in a row.",
        "Trading while distracted by personal stress or fatigue."
      ],
      tailRiskScenario: "After a stop-loss is hit, you get angry at the broker or market. You immediately re-enter the same trade, violating your cooldown rule. The trade fails again. You override your sizing rule, double your position, and enter a third time. The market continues its move against you, resulting in a massive draw down from consecutive rule-breaking.",
      defensePlan: [
        "Create a physical checklist of your rules and check them off manually before every trade.",
        "Establish a rule: if you violate any rule once, you must stop trading for the entire day.",
        "Appoint a trading partner or use a platform lock to enforce discipline limits."
      ]
    };
  }

  // 3. Emotional/Vulnerable cases (overallAvg > 2.2) - Determine worst category
  let maxCategory = "";
  let maxAvg = 0;
  
  // Find if all category scores are equal (meaning they are tied)
  const uniqueScores = new Set(Object.values(categoryScores).map(d => d.total / d.count));
  const isTie = uniqueScores.size === 1;

  if (isTie) {
    if (overallAvg >= 4.5) {
      maxCategory = "Rule Consistency"; // Returns "The Volatile Rule-Overrider"
    } else if (overallAvg >= 3.5) {
      maxCategory = "Impulse & Over-Participation"; // Returns "The Action-Addicted Scalper"
    } else {
      maxCategory = "Risk Planning & Positioning"; // Returns "The Blind Risk Taker"
    }
  } else {
    // To avoid bias from order of categories, we sort them or prioritize based on average score.
    Object.entries(categoryScores).forEach(([cat, data]) => {
      const avg = data.total / data.count;
      if (avg > maxAvg) {
        maxAvg = avg;
        maxCategory = cat;
      }
    });
  }

  // Default fallback values
  let archetype = "The Balanced Performer - You maintain a highly disciplined profile with structured rules, but remain vulnerable to sudden market regime changes.";
  let triggers = [
    "Sudden volatility in the first 15 minutes of trading.",
    "A minor loss occurring on a trade that was green for a long time.",
    "Consecutive quiet days leading to over-trading out of boredom."
  ];
  let tailRiskScenario = "After a series of small wins, you face a minor loss. Frustrated by the setback, you increase position size on the next trade to recover. The trade goes against you, you delay your exit past your stop-loss, converting a standard controlled loss into a catastrophic account drawdown.";
  let defensePlan = [
    "Limit maximum daily trades to 5, regardless of profitability.",
    "Implement an automatic daily loss limit at 2% of total capital.",
    "Mandate a 10-minute away-from-keyboard cool down after any losing trade."
  ];

  if (maxCategory === "Stop-Loss & Loss Response") {
    archetype = "The Loss-Averse Recovery Chaser - Prone to high distress when price approaches stop-losses, you tend to hesitate at exits. You possess strong initial setup discipline but struggle to accept negative outcomes, leading to aggressive recovery pressure.";
    triggers = [
      "A trade going negative immediately after entry, causing system disbelief.",
      "Price hovering pennies above your stop-loss, causing exit hesitation.",
      "Hitting a daily loss limit and feeling an urgent need to trade again to recover."
    ];
    tailRiskScenario = "You enter a position that quickly moves against you. Unable to accept the loss, you cancel your stop-loss order, hoping for a bounce. As the losses widen, you add to the losing position to average out your entry. The market continues its slide, leading to a massive, unhedged loss that wipes out weeks of gains.";
    defensePlan = [
      "Use strict bracket orders where stop-losses are hard-coded at entry and cannot be modified.",
      "Disconnect your trading platform immediately upon hitting your daily loss limit.",
      "Journal your emotional state on a scale of 1-5 before exiting any trade."
    ];
  } else if (maxCategory === "Behaviour After Profits") {
    archetype = "The Euphoric Size-Expander - Highly disciplined under drawdowns, you are paradoxically vulnerable to winning streaks. Consecutive wins trigger extreme confidence, causing you to treat rules as flexible suggestions and scale sizing unsafely.";
    triggers = [
      "A three-trade winning streak, creating a feeling of market invincibility.",
      "Achieving your daily target in the first 30 minutes, tempting you to play with 'house money'.",
      "Experiencing a massive profit day and immediately doubling your size for the next session."
    ];
    tailRiskScenario = "You achieve three large wins in a row. Overconfident in your ability to read the market, you double your standard size and take a sub-optimal setup. The trade fails, erasing today's profits. Stung by the reversal of fortune, you double size again to get back to the peak, resulting in a devastating blowup on the largest size of the day.";
    defensePlan = [
      "Commit to a fixed position size for blocks of 20 trades; do not scale up mid-block.",
      "Enforce a 'one-and-done' rule: after a target win day, shut down your platform completely.",
      "Calculate your risk-adjusted metrics weekly and review rules before increasing size."
    ];
  } else if (maxCategory === "Risk Planning & Positioning") {
    archetype = "The Blind Risk Taker - You focus heavily on market setups and entries, but ignore capital preservation math. You enter trades impulsively without predefining your precise rupee risk or size, leading to wild fluctuations in P&L volatility.";
    triggers = [
      "A fast-moving breakout setup, causing you to buy instantly without size calculations.",
      "Trading a new instrument or stock without researching its specific tick size and volatility.",
      "Entering a trade on leverage because of a high-conviction tip."
    ];
    tailRiskScenario = "A stock starts surging. Fearing you will miss a huge move, you buy a large block of shares without calculating your stop-loss or distance. The stock experiences a sharp retracement. Because of your bloated position size, your capital experiences a huge draw down in minutes, forcing you to panic-sell at the absolute bottom.";
    defensePlan = [
      "Mandatorily use the INTROSPECT position size calculator before executing any trade.",
      "Write down entry, stop, and target targets on paper before placing the order.",
      "Restrict trading to only three pre-selected liquid symbols to keep sizing familiar."
    ];
  } else if (maxCategory === "Impulse & Over-Participation") {
    archetype = "The Action-Addicted Scalper - You trade to participate rather than wait for high-probability setups. You find it extremely difficult to remain inactive during slow markets or sideways ranges, leading to capital erosion via minor commissions and slippage.";
    triggers = [
      "Sideways, low-volatility lunchtime markets (12:00 PM - 1:30 PM).",
      "Watching other traders post profits on social media while you are in cash.",
      "A clean trade setup that you missed, triggering an urge to take a sub-optimal trade immediately."
    ];
    tailRiskScenario = "The market is in a tight range. Bored by the lack of movement, you enter a minor trade just to 'feel the market'. The trade is flat. You exit and enter another. By the time the actual breakout occurs, you have taken 10 micro-trades, suffered multiple papercut losses, and accumulated heavy transaction fees, leaving you mentally exhausted and down for the day.";
    defensePlan = [
      "Implement a hard daily cap of 3 trades; once reached, lock the platform.",
      "Do not trade between 12:00 PM and 1:30 PM under any circumstances.",
      "Set a timer: you must wait at least 30 minutes between trade exits and new entries."
    ];
  } else if (maxCategory === "Rule Consistency") {
    archetype = "The Volatile Rule-Overrider - You have a solid theoretical understanding of risk but override your boundaries when under pressure. You repeatedly commit the same mistakes despite logging and reviewing them, indicating a breakdown in execution control.";
    triggers = [
      "Experiencing a slippage or execution delay that worsens your entry price.",
      "A series of choppy market whipsaws that hit multiple stops in a row.",
      "Trading while distracted by personal stress or fatigue."
    ];
    tailRiskScenario = "After a stop-loss is hit, you get angry at the broker or market. You immediately re-enter the same trade, violating your cooldown rule. The trade fails again. You override your sizing rule, double your position, and enter a third time. The market continues its move against you, resulting in a massive draw down from consecutive rule-breaking.";
    defensePlan = [
      "Create a physical checklist of your rules and check them off manually before every trade.",
      "Establish a rule: if you violate any rule once, you must stop trading for the entire day.",
      "Appoint a trading partner or use a platform lock to enforce discipline limits."
    ];
  }

  return {
    archetype,
    triggers,
    tailRiskScenario,
    defensePlan
  };
}

/**
 * Generates an AI Risk Report Summary using Kimi 2.6.
 */
export async function generateRiskReportSummary(data: {
  overallScore: number;
  riskLevel: string;
  categories: Array<{ name: string; risk_percent: number; risk_band: string; issues?: string[] }>;
}): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const categoriesStr = data.categories.map(c => 
    `- ${c.name}: ${c.risk_band} Risk (${Math.round(c.risk_percent * 100)}% exposure). Issues: ${c.issues?.join(", ") || "None"}`
  ).join("\n");

  const systemPrompt = `You are INTROSPECT™ AI Risk Profiler.
Provide a high-impact, professional 3-4 sentence paragraph executive summary diagnosing the trader's psychological profile and risk exposure based on their recent diagnostic assessment:
- Overall Discipline Score: ${data.overallScore}/100
- Risk Level: ${data.riskLevel.toUpperCase()}
- Category Breakdown:
${categoriesStr}

You speak with clinical authority, directness, and absolute objectivity. Avoid generic opening phrases like "Based on...", "This report suggests...", or "As an AI...". Provide a direct, synthesized narrative explaining how their psychological archetype impacts their trading, their core cognitive distortions (e.g. loss aversion, action bias), and the single most critical behavioral guardrail they must enforce to protect their capital. 

Keep the response strictly under 120 words, formatted as a single cohesive paragraph.`;

  try {
    return await callKimi([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate my risk report executive summary." }
    ], MODEL_COMPLEX, 400);
  } catch (err) {
    // Return a professional rule-based fallback if API fails
    const fallbackText = `Your overall risk profile is classified as ${data.riskLevel.toUpperCase()} with an execution discipline score of ${data.overallScore}/100. Diagnostic analysis identifies primary vulnerabilities in ${data.categories.filter(c => c.risk_band === "High" || c.risk_band === "Medium").map(c => c.name).join(", ") || "risk planning"}. These patterns indicate susceptibility to execution deviations, specifically stop-loss adjustments and size expansion during drawdown cycles. To safeguard capital, you must implement bracket order entries with locked stop-losses and enforce an absolute daily trade limit.`;
    return {
      content: fallbackText,
      promptTokens: 0,
      completionTokens: 0
    };
  }
}
