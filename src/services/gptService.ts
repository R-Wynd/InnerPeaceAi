// Using Google Gemini API with Flash 2.0 model
// Get your API key at: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const THERAPEUTIC_SYSTEM_PROMPT = `You are InnerPeace AI, a compassionate and empathetic mental health support assistant. Your role is to:

1. Provide emotional support and validation
2. Guide users through evidence-based CBT (Cognitive Behavioral Therapy) and DBT (Dialectical Behavior Therapy) exercises
3. Help users identify thought patterns and cognitive distortions
4. Teach coping strategies and mindfulness techniques
5. Encourage professional help when appropriate

IMPORTANT GUIDELINES:
- Always be warm, non-judgmental, and supportive
- Use active listening techniques (reflect feelings, ask clarifying questions)
- Never diagnose or replace professional mental health care
- If someone expresses suicidal thoughts or self-harm, provide crisis resources immediately
- Keep responses concise but meaningful
- Offer specific exercises when appropriate

CBT Techniques you can guide:
- Thought Records (identifying automatic thoughts)
- Cognitive Restructuring (challenging negative thoughts)
- Behavioral Activation (activity scheduling)
- Problem-Solving

DBT Skills you can teach:
- Mindfulness (observe, describe, participate)
- Distress Tolerance (TIPP, STOP, self-soothe)
- Emotion Regulation (opposite action, checking the facts)
- Interpersonal Effectiveness (DEAR MAN, GIVE, FAST)

Always end crisis situations with: "If you're in crisis, please contact the 988 Suicide & Crisis Lifeline by calling or texting 988."`;

export const sendChatMessage = async (
  message: string,
  conversationHistory: { role: string; content: string }[]
): Promise<string> => {
  try {
    const result = await callGeminiAPI(message, conversationHistory);
    if (!result) {
      return getMockResponse(message);
    }
    return result;
  } catch (error) {
    console.error('Gemini API error:', error);
    return getMockResponse(message);
  }
};

export const analyzeSentiment = async (text: string): Promise<{
  score: number;
  label: string;
  insights: string[];
}> => {
  try {
    const prompt = `Analyze the emotional content of this journal entry and provide a JSON response with:
1. "score": a number from -1 (very negative) to 1 (very positive)
2. "label": one of "Very Negative", "Negative", "Neutral", "Positive", "Very Positive"
3. "insights": an array of 2-3 brief insights about emotional patterns or thoughts expressed

Journal entry: "${text}"

Respond ONLY with valid JSON, no additional text.`;

    const raw = await callGeminiSimple(prompt);
    if (!raw) {
      return getMockSentimentAnalysis(text);
    }
    const jsonText = raw.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return getMockSentimentAnalysis(text);
  }
};

export const generateCBTExercise = async (concern: string): Promise<string> => {
  try {
    const prompt = `${THERAPEUTIC_SYSTEM_PROMPT}

Based on the user's concern: "${concern}"
    
Generate a personalized CBT (Cognitive Behavioral Therapy) exercise. Include:
1. A brief explanation of why this exercise might help
2. Step-by-step instructions (numbered list)
3. An example of how to apply it to their situation
4. A reflection prompt to use afterward

Keep the response warm, supportive, and actionable.`;

    const result = await callGeminiSimple(prompt);
    if (!result) {
      return getMockCBTExercise(concern);
    }
    return result;
  } catch (error) {
    console.error('CBT exercise generation error:', error);
    return getMockCBTExercise(concern);
  }
};

export const generateDBTSkill = async (situation: string): Promise<string> => {
  try {
    const prompt = `${THERAPEUTIC_SYSTEM_PROMPT}

Based on the user's situation: "${situation}"

Recommend and teach a DBT (Dialectical Behavior Therapy) skill that would be helpful. Include:
1. The skill name and which DBT module it belongs to (Mindfulness, Distress Tolerance, Emotion Regulation, or Interpersonal Effectiveness)
2. Why this skill is relevant to their situation
3. Step-by-step instructions to practice the skill
4. Tips for making it more effective

Keep the response compassionate and practical.`;

    const result = await callGeminiSimple(prompt);
    if (!result) {
      return getMockDBTSkill(situation);
    }
    return result;
  } catch (error) {
    console.error('DBT skill generation error:', error);
    return getMockDBTSkill(situation);
  }
};

// Gemini API call with conversation history (multi-turn)
async function callGeminiAPI(
  message: string,
  conversationHistory: { role: string; content: string }[]
): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.log('No Gemini API key configured. Using mock responses.');
    console.log('Get your API key at: https://aistudio.google.com/app/apikey');
    return null;
  }

  try {
    console.log('Calling Gemini 2.0 Flash API...');

    // Build contents array with system instruction and conversation history
    const contents = [
      // System instruction as first user message
      {
        role: 'user',
        parts: [{ text: `Instructions for you: ${THERAPEUTIC_SYSTEM_PROMPT}\n\nNow respond to the user's messages.` }]
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I am InnerPeace AI, ready to provide compassionate mental health support using CBT and DBT techniques. How can I help you today?' }]
      },
      // Add conversation history
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      // Add current message
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error response:', response.status, errorData);
      return null;
    }

    const data = await response.json();
    console.log('Gemini 2.0 Flash API success!');

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    return text || null;
  } catch (error) {
    console.error('Gemini API request failed:', error);
    return null;
  }
}

// Simple Gemini API call for single prompts
async function callGeminiSimple(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    return text || null;
  } catch {
    return null;
  }
}

// Mock responses for demo/offline mode
function getMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried')) {
    return `I hear that you're feeling anxious, and I want you to know that's completely valid. Anxiety is our mind's way of trying to protect us, even when it can feel overwhelming.

Let me guide you through a quick grounding exercise called the 5-4-3-2-1 technique:

**5-4-3-2-1 Grounding Exercise:**
1. **5 things you can SEE** - Look around and name 5 things you can see right now
2. **4 things you can TOUCH** - Notice 4 things you can physically feel (your feet on the floor, the chair supporting you)
3. **3 things you can HEAR** - Listen for 3 sounds around you
4. **2 things you can SMELL** - Notice 2 scents in your environment
5. **1 thing you can TASTE** - Focus on one taste in your mouth

This helps bring your attention back to the present moment. Would you like to try it together, or would you prefer to talk more about what's causing your anxiety?`;
  }
  
  if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
    return `Thank you for sharing how you're feeling. It takes courage to acknowledge when we're feeling down. Your feelings are valid, and you don't have to face this alone.

When we're feeling sad, our minds can get caught in negative thought patterns. Let me share a CBT technique called "Thought Challenging":

**Thought Challenging Exercise:**
1. **Identify the thought**: What negative thought is running through your mind right now?
2. **Examine the evidence**: What facts support this thought? What facts contradict it?
3. **Alternative perspective**: How might a caring friend view this situation?
4. **Balanced thought**: Can you create a more balanced version of the original thought?

Would you like to work through this together? You can share a specific thought, and I'll help you examine it gently.

Remember: Sadness is a natural emotion, and reaching out for support shows strength. 💙`;
  }
  
  if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed')) {
    return `I can sense that you're feeling overwhelmed, and I want you to know that it's okay to feel this way. Life can pile up sometimes, and it's natural to feel stressed.

Let me teach you the **STOP** skill from DBT (Dialectical Behavior Therapy):

**S - Stop**: Pause what you're doing. Don't react immediately.
**T - Take a breath**: Take one slow, deep breath. Feel your feet on the ground.
**O - Observe**: Notice what's happening inside you (thoughts, feelings, body sensations) and around you.
**P - Proceed mindfully**: Ask yourself "What's the most helpful thing I can do right now?"

This simple technique can help create space between stimulus and response, giving you back a sense of control.

Would you like to tell me more about what's overwhelming you? Sometimes breaking things down into smaller pieces can make them feel more manageable.`;
  }

  if (lowerMessage.includes('angry') || lowerMessage.includes('mad') || lowerMessage.includes('frustrated')) {
    return `I can hear that you're feeling frustrated or angry right now. Those are powerful emotions, and it's important to acknowledge them rather than push them away.

Let me share a technique called **RAIN** that can help you work through difficult emotions:

**R - Recognize**: Notice and name what you're feeling. "I am feeling angry."
**A - Allow**: Let the feeling be there without trying to fix or change it immediately.
**I - Investigate**: With curiosity, explore where you feel it in your body. What triggered it?
**N - Nurture**: Offer yourself compassion. What would you say to a friend feeling this way?

Anger often tells us something important - maybe a boundary was crossed, or a need isn't being met.

Would you like to explore what might be underneath your anger? I'm here to listen. 🧡`;
  }

  if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('tired')) {
    return `Sleep difficulties can be really challenging, and I appreciate you sharing this with me. Poor sleep affects everything - our mood, our thoughts, and our ability to cope.

Here's a **Sleep Hygiene** checklist that many people find helpful:

**Before Bed:**
• Put away screens 30-60 minutes before sleep
• Keep your room cool, dark, and quiet
• Avoid caffeine after 2pm
• Create a relaxing routine (reading, gentle stretching, warm bath)

**If You Can't Sleep:**
• Don't watch the clock - turn it away from you
• If you're awake for more than 20 minutes, get up and do something calm
• Try a body scan meditation: focus on relaxing each part of your body
• Practice 4-7-8 breathing: inhale for 4, hold for 7, exhale for 8

What aspect of sleep is most challenging for you? Is it falling asleep, staying asleep, or waking up too early? 💜`;
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return `Hello! It's good to connect with you. 😊

I'm InnerPeace AI, and I'm here to support you with whatever's on your mind. Whether you want to:

• **Talk through difficult feelings** - I'm here to listen
• **Learn coping techniques** - I can guide you through CBT and DBT exercises
• **Practice mindfulness** - We can do grounding exercises together
• **Just vent** - Sometimes we just need someone to hear us

How are you feeling today? What brings you here?`;
  }
  
  return `Thank you for sharing with me. I'm here to listen and support you. 

I noticed you mentioned "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"

Can you tell me more about what's on your mind? The more you share, the better I can help guide you to exercises and techniques that might be helpful.

Some things we could explore together:
• **Thought patterns** - Are there recurring thoughts that bother you?
• **Emotions** - How would you describe what you're feeling right now?
• **Situations** - Is there a specific situation that triggered these feelings?
• **Coping strategies** - What has helped you in the past?

I'm here to listen without judgment. 💚`;
}

function getMockSentimentAnalysis(text: string): { score: number; label: string; insights: string[] } {
  const positiveWords = ['happy', 'good', 'great', 'wonderful', 'excited', 'grateful', 'love', 'joy'];
  const negativeWords = ['sad', 'angry', 'frustrated', 'anxious', 'worried', 'stressed', 'tired', 'hurt'];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  let score = (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);
  score = Math.max(-1, Math.min(1, score * 0.8));
  
  let label = 'Neutral';
  if (score > 0.5) label = 'Very Positive';
  else if (score > 0.2) label = 'Positive';
  else if (score < -0.5) label = 'Very Negative';
  else if (score < -0.2) label = 'Negative';
  
  return {
    score,
    label,
    insights: [
      'Your entry shows self-reflection and emotional awareness.',
      'Consider exploring the emotions mentioned through journaling.',
      'Remember that all emotions are valid and temporary.'
    ]
  };
}

function getMockCBTExercise(concern: string): string {
  return `Based on your concern, I'd like to guide you through a **Thought Record** exercise:

**Why This Helps:**
Thought records help us identify and examine our automatic thoughts, which are often the root of emotional distress. By writing them down, we can view them more objectively.

**Step-by-Step Instructions:**

1. **Situation**: Briefly describe what happened.
   *Example: "${concern}"*

2. **Emotions**: What emotions did you feel? Rate their intensity (0-100%).

3. **Automatic Thoughts**: What thoughts went through your mind? What did you tell yourself?

4. **Evidence For**: What facts support this thought?

5. **Evidence Against**: What facts contradict this thought?

6. **Balanced Thought**: Based on the evidence, what's a more balanced way to think about this?

7. **Re-rate Emotions**: How intense are your emotions now?

**Reflection Prompt:**
After completing this exercise, ask yourself: "What did I learn about my thinking patterns? How might I respond differently next time?"

Take your time with each step. There's no rush. 🌱`;
}

function getMockDBTSkill(_situation: string): string {
  return `For your situation, I recommend the **TIPP** skill from DBT's Distress Tolerance module.

**Why TIPP is Relevant:**
When we're in emotional distress, our body's fight-or-flight response can make it hard to think clearly. TIPP quickly changes your body chemistry to help regulate intense emotions.

**The TIPP Skill:**

**T - Temperature**
• Splash cold water on your face or hold an ice cube
• This activates the "dive reflex" and slows your heart rate
• Even 30 seconds can make a difference

**I - Intense Exercise**
• Do jumping jacks, run in place, or take a brisk walk
• Just 10-20 minutes releases endorphins
• Matches your body's arousal to your emotions, then brings both down

**P - Paced Breathing**
• Breathe out longer than you breathe in
• Try: Inhale for 4 counts, exhale for 6-8 counts
• This activates your parasympathetic nervous system

**P - Progressive Muscle Relaxation**
• Tense each muscle group for 5 seconds, then release
• Start with your toes and work up to your face
• Notice the contrast between tension and relaxation

**Tips for Success:**
• Start with whichever step feels most accessible
• You don't need to do all four—even one can help
• Practice when you're calm so it's easier when distressed
• Be patient with yourself 💙`;
}
