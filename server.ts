import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Client } from '@gradio/client';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Read Gradio URL exclusively from process.env.GEMMA_API_URL without hardcoded fallback URLs
const getGemmaApiUrl = (): string => (process.env.GEMMA_API_URL || '').trim();

// Enable JSON body parsing
app.use(express.json({ limit: '10mb' }));

// CORS configuration to ensure cross-origin safety and avoid blocking requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ==========================================
// GRADIO CLIENT CONNECTION MANAGER
// Reuses connection & handles reconnects/expiry
// ==========================================
class GradioGemmaService {
  private client: any = null;
  private connectedUrl: string = '';
  private connectionPromise: Promise<any> | null = null;

  async getClient(): Promise<any> {
    const targetUrl = getGemmaApiUrl();
    if (!targetUrl) {
      throw new Error(
        'GEMMA_API_URL is not configured. Please configure the GEMMA_API_URL environment variable with your active Kaggle Gradio public URL.'
      );
    }

    if (this.client && this.connectedUrl === targetUrl) {
      return this.client;
    }

    if (this.connectionPromise) {
      return await this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        console.log(`[Gemma Gradio] Connecting to Kaggle Gradio endpoint...`);
        const newClient = await Client.connect(targetUrl);
        this.client = newClient;
        this.connectedUrl = targetUrl;
        console.log(`[Gemma Gradio] Connected successfully to Gradio service.`);
        return newClient;
      } catch (err: any) {
        this.client = null;
        this.connectedUrl = '';
        throw new Error(
          `Unable to connect to Google Gemma 4 E2B Instruct on Kaggle: ${err.message}. Please verify that the Kaggle notebook is running with an active Gradio tunnel.`
        );
      } finally {
        this.connectionPromise = null;
      }
    })();

    return await this.connectionPromise;
  }

  // Calls /study_mate on the Gradio endpoint with { message }
  async predict(message: string): Promise<string> {
    try {
      const client = await this.getClient();
      const result = await client.predict('/study_mate', { message });
      const raw = result?.data?.[0];

      if (typeof raw === 'string') {
        return raw;
      }
      if (raw && typeof raw === 'object') {
        return typeof raw.text === 'string' ? raw.text : JSON.stringify(raw);
      }
      return String(raw || '');
    } catch (err: any) {
      console.warn('[Gemma Gradio] Call error, attempting reconnection once:', err.message);
      this.client = null;
      this.connectedUrl = '';

      // Reconnect and retry once
      try {
        const client = await this.getClient();
        const retryResult = await client.predict('/study_mate', { message });
        const raw = retryResult?.data?.[0];
        if (typeof raw === 'string') return raw;
        if (raw && typeof raw === 'object') {
          return typeof raw.text === 'string' ? raw.text : JSON.stringify(raw);
        }
        return String(raw || '');
      } catch (retryErr: any) {
        throw new Error(
          `Google Gemma 4 E2B Instruct is currently unavailable: ${retryErr.message}. The Kaggle notebook may be offline or the Gradio session may have expired.`
        );
      }
    }
  }

  // Actively test live connection without heavy token generation
  async testConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
    const targetUrl = getGemmaApiUrl();
    if (!targetUrl) {
      return {
        connected: false,
        latencyMs: 0,
        error: 'GEMMA_API_URL environment variable is not configured.',
      };
    }

    const start = Date.now();
    try {
      const client = await this.getClient();
      const api = await client.view_api();
      const hasEndpoint = Boolean(api?.named_endpoints?.['/study_mate']);
      if (!hasEndpoint) {
        return {
          connected: false,
          latencyMs: Date.now() - start,
          error: 'Endpoint /study_mate not found on Gradio app.',
        };
      }
      return { connected: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      this.client = null;
      this.connectedUrl = '';
      return {
        connected: false,
        latencyMs: Date.now() - start,
        error: err.message,
      };
    }
  }
}

const gemmaService = new GradioGemmaService();

// ==========================================
// ROBUST PARSERS FOR GEMMA 4 OUTPUTS
// Handles JSON, Markdown & Natural Language
// ==========================================

function sanitizeJsonString(raw: string): string {
  // Clean backticks
  let cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();

  // Fix unescaped backslashes in math formulas (e.g. \frac, \times, \pm)
  // that break JSON.parse because \f, \t, etc. are invalid escape sequences in JSON
  cleaned = cleaned.replace(/\\([a-zA-Z])/g, (match, letter) => {
    if (['n', 'r', 't', 'b', 'f', 'u'].includes(letter)) {
      // Preserve standard escapes if intended
      return match;
    }
    return `\\\\${letter}`;
  });

  return cleaned;
}

function extractJsonPayload(text: string): any {
  // 1. Try direct parse on sanitized text
  const cleaned = sanitizeJsonString(text);
  try {
    return JSON.parse(cleaned);
  } catch {}

  // 2. Remove markdown code blocks ```json ... ```
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    try {
      return JSON.parse(sanitizeJsonString(codeBlockMatch[1]));
    } catch {}
  }

  // 3. Find outermost array [ ... ]
  const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(sanitizeJsonString(arrayMatch[0]));
    } catch {}
  }

  // 4. Find outermost object { ... }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(sanitizeJsonString(objMatch[0]));
    } catch {}
  }

  throw new Error('Not valid JSON');
}

// ==========================================
// QUIZ & EVALUATION VALIDATION INTERFACES
// ==========================================
interface ValidatedOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

interface ValidatedQuizQuestion {
  id: string;
  questionNumber: number;
  type: 'multiple_choice';
  prompt: string;
  options: ValidatedOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  curriculumReference?: string;
  distractorNotes?: Record<string, string>;
}

// Validates a single question candidate. Rejects any incomplete or malformed question.
function validateQuestionCandidate(
  q: any,
  index: number,
  subject: string,
  level: string
): ValidatedQuizQuestion | null {
  if (!q || typeof q !== 'object') return null;

  // 1. Prompt validation: must be a meaningful non-empty string
  const prompt = typeof q.prompt === 'string' ? q.prompt.trim() : '';
  if (!prompt || prompt.length < 5) return null;

  // 2. Options validation: Must have at least 4 options and provide distinct text for A, B, C, and D
  if (!Array.isArray(q.options) || q.options.length < 4) return null;

  const optionMap: Partial<Record<'A' | 'B' | 'C' | 'D', string>> = {};

  for (let i = 0; i < q.options.length; i++) {
    const opt = q.options[i];
    let key: 'A' | 'B' | 'C' | 'D' | null = null;
    let text = '';

    if (typeof opt === 'string') {
      const defaultKey = ['A', 'B', 'C', 'D'][i];
      if (defaultKey === 'A' || defaultKey === 'B' || defaultKey === 'C' || defaultKey === 'D') {
        key = defaultKey;
      }
      text = opt.trim();
    } else if (opt && typeof opt === 'object') {
      const rawId = (opt.id || ['A', 'B', 'C', 'D'][i] || '').toString().trim().toUpperCase();
      if (rawId === 'A' || rawId === 'B' || rawId === 'C' || rawId === 'D') {
        key = rawId;
      }
      text = (typeof opt.text === 'string' ? opt.text : String(opt.text || '')).trim();
    }

    if (key && text.length > 0 && !optionMap[key]) {
      optionMap[key] = text;
    }
  }

  // Reject question if any of the 4 options A, B, C, D are missing or empty
  if (!optionMap.A || !optionMap.B || !optionMap.C || !optionMap.D) {
    return null;
  }

  // 3. Correct answer validation: must correspond to one of the 4 options
  let rawAns = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim().toUpperCase() : '';
  if (rawAns.startsWith('OPTION')) {
    rawAns = rawAns.replace(/^OPTION\s*/i, '').trim();
  }
  const matchLetter = rawAns.match(/\b([A-D])\b/);
  let resolvedAnswer: 'A' | 'B' | 'C' | 'D' | null = null;

  if (matchLetter && ['A', 'B', 'C', 'D'].includes(matchLetter[1])) {
    resolvedAnswer = matchLetter[1] as 'A' | 'B' | 'C' | 'D';
  } else if (rawAns === 'A' || rawAns === 'B' || rawAns === 'C' || rawAns === 'D') {
    resolvedAnswer = rawAns;
  } else {
    // Check if the answer text corresponds directly to one of the option texts
    for (const [k, v] of Object.entries(optionMap)) {
      if (v.toLowerCase() === rawAns.toLowerCase()) {
        resolvedAnswer = k as 'A' | 'B' | 'C' | 'D';
        break;
      }
    }
  }

  if (!resolvedAnswer) {
    return null; // Reject question without a valid verifiable correct answer
  }

  // 4. Explanation validation: must provide meaningful reasoning
  const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : '';
  if (!explanation || explanation.length < 5) {
    return null; // Reject questions without an explanation
  }

  return {
    id: q.id || `q-${index + 1}-${Date.now()}`,
    questionNumber: index + 1,
    type: 'multiple_choice',
    prompt,
    options: [
      { id: 'A', text: optionMap.A },
      { id: 'B', text: optionMap.B },
      { id: 'C', text: optionMap.C },
      { id: 'D', text: optionMap.D },
    ],
    correctAnswer: resolvedAnswer,
    explanation,
    curriculumReference: q.curriculumReference || `Nigerian ${level} ${subject} Syllabus`,
    distractorNotes: q.distractorNotes && typeof q.distractorNotes === 'object' ? q.distractorNotes : undefined,
  };
}

// Parses Markdown questions from Gemma (## Question 1, **Question:**, A), Correct Answer:, Explanation:)
function parseMarkdownQuizQuestions(
  text: string,
  subject: string,
  topic: string,
  level: string
): ValidatedQuizQuestion[] {
  const questions: ValidatedQuizQuestion[] = [];

  // Split on question headers e.g. "## Question 1", "**Question 1**", "Question 1:", "Q1."
  const chunks = text.split(
    /(?:^|\n)(?=##\s*Question\s*\d+|\*\*\s*Question\s*\d+\s*\*\*|\bQuestion\s+\d+\s*[\:\.\)]|\bQ\d+[\:\.\)])/i
  );

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;

    // Extract prompt
    let prompt = '';
    const promptMatch = chunk.match(
      /(?:\*\*Question\s*[\:\*]*\s*|\bQuestion\s*\d*[\:\.]\s*)([\s\S]*?)(?=(?:\n\s*(?:\*\*)?[A-D]\s*[\)\.\:]|\*\*Correct Answer))/i
    );
    if (promptMatch) {
      prompt = promptMatch[1].replace(/^\*\*+|\*\*+$/g, '').trim();
    } else {
      const parts = chunk.split(/(?:\n\s*(?:\*\*)?[A-D]\s*[\)\.\:])/i);
      if (parts.length > 1) {
        prompt = parts[0]
          .replace(/^#+\s*Question\s*\d+/i, '')
          .replace(/^\*\*Question\s*\d*\**/i, '')
          .trim();
      }
    }

    // Extract options A, B, C, D
    const optionsRaw: { id: string; text: string }[] = [];
    const optRegex = /(?:^|\n)\s*(?:\*\*)?([A-D])(?:\*\*)?\s*[\)\.\:]\s*(?:\*\*)?\s*([^\n]+)/gi;
    let optMatch: RegExpExecArray | null;
    while ((optMatch = optRegex.exec(chunk)) !== null) {
      const optId = optMatch[1].toUpperCase();
      const optText = optMatch[2].replace(/\*\*+$/g, '').trim();
      if (!optionsRaw.some((o) => o.id === optId)) {
        optionsRaw.push({ id: optId, text: optText });
      }
    }

    // Extract correct answer
    let correctAnswer = '';
    const ansMatch = chunk.match(/(?:Correct\s+Answer|Answer)\s*[\:\*]*\s*([A-D]|\bOption\s+[A-D]\b|[^\n]+)/i);
    if (ansMatch) {
      correctAnswer = ansMatch[1].trim();
    }

    // Extract explanation
    let explanation = '';
    const expMatch = chunk.match(
      /(?:\*\*Explanation|\bExplanation|Solution|Working)\s*[\:\*]*\s*([\s\S]*?)(?=(?:\n\s*##|\n\s*\*\*\s*Question|\n\s*Question\s+\d|\n\s*(?:\*\*\*|---)\s*\n|$))/i
    );
    if (expMatch) {
      explanation = expMatch[1].replace(/^\*\*+|\*\*+$/g, '').trim();
    }

    const candidate = validateQuestionCandidate(
      {
        prompt,
        options: optionsRaw,
        correctAnswer,
        explanation,
      },
      questions.length,
      subject,
      level
    );

    if (candidate) {
      questions.push(candidate);
    }
  }

  return questions;
}

// Universal Quiz Parser: Validates every question, never fabricates questions or options
function parseGemmaQuiz(
  rawText: string,
  subject: string,
  topic: string,
  level: string,
  requestedCount: number
): ValidatedQuizQuestion[] {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    throw new Error('Google Gemma model returned an empty quiz response.');
  }

  let candidates: ValidatedQuizQuestion[] = [];

  // 1. Try structured JSON extraction first
  try {
    const payload = extractJsonPayload(rawText);
    const rawList = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.questions)
      ? payload.questions
      : [];

    if (rawList.length > 0) {
      for (let i = 0; i < rawList.length; i++) {
        const validated = validateQuestionCandidate(rawList[i], candidates.length, subject, level);
        if (validated) {
          candidates.push(validated);
        }
      }
    }
  } catch {}

  // 2. If JSON extraction did not yield enough questions, try Markdown extraction
  if (candidates.length < requestedCount) {
    const mdQuestions = parseMarkdownQuizQuestions(rawText, subject, topic, level);
    if (mdQuestions.length > candidates.length) {
      candidates = mdQuestions;
    }
  }

  // Renumber validated questions sequentially
  candidates = candidates.map((q, idx) => ({
    ...q,
    questionNumber: idx + 1,
  }));

  // Validation: Reject if no valid questions were produced
  if (candidates.length === 0) {
    throw new Error(
      'Unable to extract valid 4-option multiple-choice questions from the Gemma model response. Please try generating the quiz again.'
    );
  }

  // Ensure generated quiz does not exceed requested question count
  if (candidates.length > requestedCount) {
    candidates = candidates.slice(0, requestedCount);
  }

  // If Gemma returns fewer valid questions than requested, return a clear error
  if (candidates.length < requestedCount) {
    throw new Error(
      `Incomplete quiz generated: model provided only ${candidates.length} valid 4-option question(s), but ${requestedCount} were requested. Please try generating again.`
    );
  }

  return candidates;
}

// Universal Evaluation Parser: Authenticates scores, forbids default scores, forbids fabricated rubrics
function parseGemmaEvaluation(
  rawText: string,
  question: string,
  studentAnswer: string,
  subject: string,
  examType: string,
  level: string
): any {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 25) {
    throw new Error('Google Gemma evaluation response is too brief or incomplete to verify.');
  }

  // 1. Try structured JSON parsing first
  try {
    const parsed = extractJsonPayload(rawText);
    if (parsed && typeof parsed === 'object') {
      const rawScore = parsed.totalScore ?? parsed.score;
      if (rawScore !== undefined && rawScore !== null && !isNaN(Number(rawScore))) {
        const totalScore = Number(rawScore);
        const maxScore = Number(parsed.maxScore) > 0 ? Number(parsed.maxScore) : 10;

        if (totalScore < 0 || totalScore > maxScore) {
          throw new Error(
            `Evaluated score (${totalScore}) is outside the permitted range (0 to ${maxScore}).`
          );
        }

        const percentage = Math.round((totalScore / maxScore) * 100);
        const allowedVerdicts = ['Excellent', 'Good Attempt', 'Needs Improvement', 'Substantially Incomplete'];
        const verdict = allowedVerdicts.includes(parsed.verdict)
          ? parsed.verdict
          : percentage >= 75
          ? 'Excellent'
          : percentage >= 50
          ? 'Good Attempt'
          : percentage >= 30
          ? 'Needs Improvement'
          : 'Substantially Incomplete';

        const rubricBreakdown: any[] = [];
        if (Array.isArray(parsed.rubricBreakdown)) {
          for (const item of parsed.rubricBreakdown) {
            if (item && typeof item === 'object' && item.criterion) {
              const itemTotal = Number(item.totalMarks) > 0 ? Number(item.totalMarks) : 2;
              const itemAwarded = Math.max(0, Math.min(Number(item.awardedMarks) || 0, itemTotal));
              const itemStatus =
                item.status === 'achieved' || item.status === 'missing'
                  ? item.status
                  : itemAwarded >= itemTotal * 0.75
                  ? 'achieved'
                  : itemAwarded > 0
                  ? 'partial'
                  : 'missing';

              rubricBreakdown.push({
                criterion: String(item.criterion).trim(),
                awardedMarks: itemAwarded,
                totalMarks: itemTotal,
                feedback: String(item.feedback || '').trim(),
                status: itemStatus,
              });
            }
          }
        }

        const correctPoints = Array.isArray(parsed.correctPoints)
          ? parsed.correctPoints.map((p: any) => String(p).trim()).filter(Boolean)
          : [];
        const missingPoints = Array.isArray(parsed.missingPoints)
          ? parsed.missingPoints.map((p: any) => String(p).trim()).filter(Boolean)
          : [];
        const conceptualMistakes = Array.isArray(parsed.conceptualMistakes)
          ? parsed.conceptualMistakes.map((p: any) => String(p).trim()).filter(Boolean)
          : [];
        const examinerTips = Array.isArray(parsed.examinerTips)
          ? parsed.examinerTips.map((t: any) => String(t).trim()).filter(Boolean)
          : [];

        const modelAnswer =
          typeof parsed.modelAnswer === 'string' && parsed.modelAnswer.trim().length > 0
            ? parsed.modelAnswer.trim()
            : rawText;

        return {
          id: `eval-${Date.now()}`,
          subject,
          examType,
          level,
          question,
          studentAnswer,
          totalScore,
          maxScore,
          percentage,
          verdict,
          rubricBreakdown,
          correctPoints,
          missingPoints,
          conceptualMistakes,
          modelAnswer,
          examinerTips,
          timestamp: new Date().toISOString(),
        };
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('outside the permitted range')) {
      throw err;
    }
    // Proceed to Markdown / text parsing
  }

  // 2. Parse Markdown/Text Evaluation from Gemma
  let parsedScore: number | null = null;
  let parsedMaxScore = 10;

  const scoreRegexes = [
    /(?:Overall\s+Score|Total\s+Score|Score|Mark|Final\s+Mark)\s*[\:\*]*\s*([0-9]+(?:\.[0-9]+)?)\s*(?:\/|\s*out\s*of\s*)\s*([0-9]+(?:\.[0-9]+)?)/i,
    /(?:Awarded|Grade)\s*[\:\*]*\s*([0-9]+(?:\.[0-9]+)?)\s*(?:\/|\s*out\s*of\s*)\s*([0-9]+(?:\.[0-9]+)?)/i,
    /\b([0-9]+(?:\.[0-9]+)?)\s*\/\s*(10|100|20|50)\b/,
    /(?:Overall\s+Score|Total\s+Score|Score|Mark)\s*[\:\*]*\s*([0-9]+(?:\.[0-9]+)?)\b/i,
  ];

  for (const rx of scoreRegexes) {
    const match = rawText.match(rx);
    if (match) {
      const val = parseFloat(match[1]);
      if (!isNaN(val)) {
        parsedScore = val;
        if (match[2]) {
          const maxVal = parseFloat(match[2]);
          if (!isNaN(maxVal) && maxVal > 0) {
            parsedMaxScore = maxVal;
          }
        }
        break;
      }
    }
  }

  // Reject evaluation if Gemma did not provide a score: NEVER invent a default score
  if (parsedScore === null || isNaN(parsedScore)) {
    throw new Error(
      'Gemma model response did not contain a recognizable score (e.g. "Score: X / 10"). Evaluation cannot be verified.'
    );
  }

  // Validate that the score is within the permitted range
  if (parsedScore < 0 || parsedScore > parsedMaxScore) {
    throw new Error(
      `Evaluated score (${parsedScore}) is outside the permitted range (0 to ${parsedMaxScore}).`
    );
  }

  const percentage = Math.round((parsedScore / parsedMaxScore) * 100);

  // Verdict extraction
  const verdictMatch = rawText.match(/(?:Verdict|Rating|Assessment|Judgement)\s*[\:\*]*\s*([^\n\*\#]+)/i);
  let verdict: 'Excellent' | 'Good Attempt' | 'Needs Improvement' | 'Substantially Incomplete' = 'Good Attempt';
  if (verdictMatch) {
    const vText = verdictMatch[1].toLowerCase();
    if (vText.includes('excellent') || vText.includes('outstanding') || vText.includes('distinction')) {
      verdict = 'Excellent';
    } else if (vText.includes('good') || vText.includes('credit') || vText.includes('pass')) {
      verdict = 'Good Attempt';
    } else if (vText.includes('needs improvement') || vText.includes('poor') || vText.includes('fair')) {
      verdict = 'Needs Improvement';
    } else if (vText.includes('incomplete') || vText.includes('fail') || vText.includes('substantially')) {
      verdict = 'Substantially Incomplete';
    } else {
      verdict = percentage >= 75 ? 'Excellent' : percentage >= 50 ? 'Good Attempt' : percentage >= 30 ? 'Needs Improvement' : 'Substantially Incomplete';
    }
  } else {
    verdict = percentage >= 75 ? 'Excellent' : percentage >= 50 ? 'Good Attempt' : percentage >= 30 ? 'Needs Improvement' : 'Substantially Incomplete';
  }

  // Extract Correct Points honestly from model output
  const correctPoints: string[] = [];
  const correctSection = rawText.match(
    /(?:Correct\s+Points|What\s+was\s+done\s+well|Strengths|Merits)[\:\*\#]*([\s\S]*?)(?=(?:Missing\s+Points|Omissions|Areas\s+for\s+Improvement|Conceptual\s+Mistakes|Model\s+Answer|Examiner|###|$))/i
  );
  if (correctSection) {
    const rawContent = correctSection[1].trim();
    const lines = rawContent.match(/^\s*[-*•\d\.]+\s*(.+)$/gm);
    if (lines) {
      for (const line of lines) {
        const cleaned = line.replace(/^\s*[-*•\d\.]+\s*/, '').replace(/\*\*+/g, '').trim();
        if (cleaned.length >= 3 && !cleaned.toLowerCase().startsWith('none')) {
          correctPoints.push(cleaned);
        }
      }
    } else if (rawContent.length >= 3 && !rawContent.toLowerCase().startsWith('none')) {
      correctPoints.push(rawContent.replace(/\*\*+/g, '').trim());
    }
  }

  // Extract Missing Points honestly from model output
  const missingPoints: string[] = [];
  const missingSection = rawText.match(
    /(?:Missing\s+Points|Omissions|Lost\s+Marks|Areas\s+for\s+Improvement|Deficiencies)[\:\*\#]*([\s\S]*?)(?=(?:Conceptual\s+Mistakes|Model\s+Answer|Examiner|Rubric|###|$))/i
  );
  if (missingSection) {
    const rawContent = missingSection[1].trim();
    const lines = rawContent.match(/^\s*[-*•\d\.]+\s*(.+)$/gm);
    if (lines) {
      for (const line of lines) {
        const cleaned = line.replace(/^\s*[-*•\d\.]+\s*/, '').replace(/\*\*+/g, '').trim();
        if (cleaned.length >= 3 && !cleaned.toLowerCase().startsWith('none')) {
          missingPoints.push(cleaned);
        }
      }
    } else if (rawContent.length >= 3 && !rawContent.toLowerCase().startsWith('none')) {
      missingPoints.push(rawContent.replace(/\*\*+/g, '').trim());
    }
  }

  // Extract Conceptual Mistakes honestly from model output
  const conceptualMistakes: string[] = [];
  const conceptualSection = rawText.match(
    /(?:Conceptual\s+Mistakes|Errors|Misconceptions)[\:\*\#]*([\s\S]*?)(?=(?:Model\s+Answer|Examiner|Rubric|###|$))/i
  );
  if (conceptualSection) {
    const rawContent = conceptualSection[1].trim();
    const lines = rawContent.match(/^\s*[-*•\d\.]+\s*(.+)$/gm);
    if (lines) {
      for (const line of lines) {
        const cleaned = line.replace(/^\s*[-*•\d\.]+\s*/, '').replace(/\*\*+/g, '').trim();
        if (cleaned.length >= 3 && !cleaned.toLowerCase().startsWith('none')) {
          conceptualMistakes.push(cleaned);
        }
      }
    } else if (rawContent.length >= 3 && !rawContent.toLowerCase().startsWith('none')) {
      conceptualMistakes.push(rawContent.replace(/\*\*+/g, '').trim());
    }
  }

  // Extract Examiner Tips honestly from model output
  const examinerTips: string[] = [];
  const tipsSection = rawText.match(
    /(?:Examiner\s+Advice|Examiner\s+Tips|Examination\s+Tips|Advice\s+for\s+the\s+Hall)[\:\*\#]*([\s\S]*?)(?=(?:Model\s+Answer|###|$))/i
  );
  if (tipsSection) {
    const rawContent = tipsSection[1].trim();
    const lines = rawContent.match(/^\s*[-*•\d\.]+\s*(.+)$/gm);
    if (lines) {
      for (const line of lines) {
        const cleaned = line.replace(/^\s*[-*•\d\.]+\s*/, '').replace(/\*\*+/g, '').trim();
        if (cleaned.length >= 3) {
          examinerTips.push(cleaned);
        }
      }
    } else if (rawContent.length >= 3) {
      const textLines = rawContent
        .split('\n')
        .map((l) => l.replace(/\*\*+/g, '').trim())
        .filter((l) => l.length >= 3);
      examinerTips.push(...textLines);
    }
  }

  // Extract Model Answer honestly from model output
  let modelAnswer = '';
  const modelMatch = rawText.match(
    /(?:Model\s+Answer|A\*\s+Model\s+Answer|Ideal\s+Answer|Marking\s+Scheme\s+Answer)[\:\*\#]*([\s\S]*?)(?=(?:Examiner\s+Advice|Examiner\s+Tips|###\s*\d|$))/i
  );
  if (modelMatch && modelMatch[1].trim().length >= 10) {
    modelAnswer = modelMatch[1].trim();
  } else {
    modelAnswer = rawText;
  }

  // Extract Rubric Breakdown if provided by Gemma in markdown
  const rubricBreakdown: any[] = [];
  const rubricSection = rawText.match(
    /(?:Rubric\s+Breakdown|Marking\s+Rubric|Marking\s+Scheme\s+Breakdown)[\:\*\#]*([\s\S]*?)(?=(?:Correct\s+Points|Missing\s+Points|Model\s+Answer|###|$))/i
  );
  if (rubricSection) {
    const rubricLines = rubricSection[1].split('\n').filter((l) => l.trim().length > 0);
    for (const rLine of rubricLines) {
      const lineScoreMatch = rLine.match(
        /[-*•]?\s*([^:\(\d\|]+)[\:\-\|]\s*([0-9]+(?:\.[0-9]+)?)\s*(?:\/|\s*out\s*of\s*)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:marks?|pts?)?(?:\s*[\:\-\|]\s*(.+))?/i
      );
      if (lineScoreMatch) {
        const critName = lineScoreMatch[1].replace(/[*_#|]/g, '').trim();
        const awarded = parseFloat(lineScoreMatch[2]);
        const total = parseFloat(lineScoreMatch[3]);
        const feedback = lineScoreMatch[4] ? lineScoreMatch[4].replace(/[|]/g, '').trim() : '';

        if (critName && !isNaN(awarded) && !isNaN(total) && total > 0) {
          rubricBreakdown.push({
            criterion: critName,
            awardedMarks: awarded,
            totalMarks: total,
            feedback,
            status: awarded >= total * 0.75 ? 'achieved' : awarded > 0 ? 'partial' : 'missing',
          });
        }
      }
    }
  }

  return {
    id: `eval-${Date.now()}`,
    subject,
    examType,
    level,
    question,
    studentAnswer,
    totalScore: parsedScore,
    maxScore: parsedMaxScore,
    percentage,
    verdict,
    rubricBreakdown,
    correctPoints,
    missingPoints,
    conceptualMistakes,
    modelAnswer,
    examinerTips,
    timestamp: new Date().toISOString(),
  };
}

// Distinguishes Gradio network/connection issues from model validation errors
function isGradioConnectionError(err: any): boolean {
  if (!err) return false;
  if (err.isConnectionError) return true;
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('unable to connect') ||
    msg.includes('currently unavailable') ||
    msg.includes('kaggle') ||
    msg.includes('not configured') ||
    msg.includes('econnrefused') ||
    msg.includes('fetch failed') ||
    msg.includes('app config') ||
    msg.includes('session may have expired')
  );
}

// ==========================================
// API ROUTES
// ==========================================

// 0. Application Health Check (Required for Render and uptime monitoring)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'StudyMate AI',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 1. Live Status Check
app.get('/api/ai/status', async (req: Request, res: Response) => {
  try {
    const targetUrl = getGemmaApiUrl();
    if (!targetUrl) {
      res.status(503).json({
        status: 'offline',
        model: 'Google Gemma 4 E2B Instruct',
        endpointConfigured: false,
        endpoint: 'Not configured',
        features: [
          'Google Gemma 4 E2B Instruct via Kaggle Gradio',
          'Interactive Nigerian Curriculum Tutoring (JSS, SS, University)',
        ],
        latencyMs: 0,
        error: 'GEMMA_API_URL environment variable is not configured. Please supply your Kaggle Gradio link.',
      });
      return;
    }

    const check = await gemmaService.testConnection();
    if (check.connected) {
      res.json({
        status: 'connected',
        model: 'Google Gemma 4 E2B Instruct',
        endpointConfigured: true,
        endpoint: 'Configured (Active Kaggle Gradio Tunnel)',
        features: [
          'Google Gemma 4 E2B Instruct via Kaggle Gradio',
          'Interactive Nigerian Curriculum Tutoring (JSS, SS, University)',
          'Genuine Gemma Practice Quiz Generation',
          'Genuine Gemma Essay & Theory Rubric Grading',
        ],
        latencyMs: check.latencyMs,
        error: null,
      });
    } else {
      res.status(503).json({
        status: 'offline',
        model: 'Google Gemma 4 E2B Instruct',
        endpointConfigured: true,
        endpoint: 'Configured (Unreachable)',
        features: [
          'Google Gemma 4 E2B Instruct via Kaggle Gradio',
          'Interactive Nigerian Curriculum Tutoring',
        ],
        latencyMs: check.latencyMs,
        error: check.error || 'Gradio endpoint is unreachable. Please verify your Kaggle notebook is running.',
      });
    }
  } catch (error: any) {
    res.status(503).json({
      status: 'offline',
      model: 'Google Gemma 4 E2B Instruct',
      endpointConfigured: Boolean(getGemmaApiUrl()),
      endpoint: 'Configured (Unreachable)',
      latencyMs: 0,
      error: error.message || 'AI service is currently offline.',
    });
  }
});

// 2. AI Tutor Chat
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      subject = 'General Academic',
      level = 'SS1–SS3',
      actionType = 'standard',
      history = [],
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message text is required.' });
      return;
    }

    let actionInstruction = '';
    if (actionType === 'example') {
      actionInstruction =
        'Focus on providing practical, everyday Nigerian real-life examples (e.g. Nigerian markets, naira currency, local transport/danfo, power/generators, Nigerian ecosystems or industries) that make this concept crystal clear.';
    } else if (actionType === 'simplify') {
      actionInstruction =
        'Explain this concept in the simplest, most intuitive terms without heavy academic jargon. Use relatable analogies.';
    } else if (actionType === 'step_by_step') {
      actionInstruction =
        'Provide a methodical, step-by-step derivation or problem-solving sequence. State given parameters, governing laws/formulae, substitutions, and intermediate checks.';
    } else if (actionType === 'past_question') {
      actionInstruction =
        'Show how this concept is typically tested in Nigerian examinations (WAEC/WASSCE, NECO, or JAMB/UTME). Include a sample question and the examiner marking points.';
    }

    const conversationContext = history.length
      ? `Prior conversation history:\n${history
          .map((h: any) => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.content}`)
          .join('\n')}\n\n`
      : '';

    const promptForGemma = `You are StudyMate AI, an intelligent, patient, and highly skilled Nigerian academic tutor powered by Google Gemma 4 E2B Instruct.
The student is studying "${subject}" at the "${level}" educational level in Nigeria (e.g. JSS for Basic Education Certificate, SS for WAEC/NECO/JAMB, or Nigerian University undergraduate).

${conversationContext}Current Student Question: "${message}"

Instructions:
1. Explain thoroughly and accurately according to the Nigerian ${level} curriculum in ${subject}.
2. Use clear formatting with Markdown headings (###), bold key terms, and bullet points.
3. ${actionInstruction || 'Provide a complete conceptual explanation with practical relevance and high-yield examination tips.'}
4. Encourage understanding rather than rote memorisation.
5. At the end, provide 3 suggested follow-up questions the student can ask next.`;

    const gemmaResponse = await gemmaService.predict(promptForGemma);

    const followUps: string[] = [];
    const followUpLines = gemmaResponse.split('\n').filter((l) =>
      /^\d+[\.\)]\s+|^[-*]\s+/.test(l.trim()) && l.toLowerCase().includes('?')
    );
    if (followUpLines.length >= 2) {
      for (const line of followUpLines.slice(0, 3)) {
        followUps.push(line.replace(/^\d+[\.\)]\s+|^[-*]\s+/, '').trim());
      }
    } else {
      followUps.push(
        `Can you give me a real-life Nigerian example in ${subject}?`,
        'Can you break this down step-by-step with a practice calculation?',
        'How does WAEC or JAMB test this in the examination?'
      );
    }

    res.json({
      content: gemmaResponse,
      suggestedFollowUps: followUps,
    });
  } catch (error: any) {
    const isConn = isGradioConnectionError(error);
    const statusCode = isConn ? 503 : 502;
    console.error(`[API Chat Error - HTTP ${statusCode}]`, error.message);
    res.status(statusCode).json({
      error: error.message || 'Google Gemma 4 E2B Instruct is currently unavailable.',
    });
  }
});

// 3. AI Quiz Generator
app.post('/api/ai/quiz', async (req: Request, res: Response) => {
  try {
    const {
      subject = 'Mathematics',
      topic = 'Algebraic Processes',
      difficulty = 'Medium',
      count = 5,
      level = 'SS1–SS3',
    } = req.body;

    const parsedCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 10);

    const promptForGemma = `You are Google Gemma 4 E2B Instruct. Generate a practice quiz with ${parsedCount} multiple-choice examination questions for Nigerian students.
Subject: ${subject}
Topic: ${topic}
Level: ${level} (${difficulty} difficulty)

Format each question clearly as follows:
## Question 1
**Question:** [Question statement]
A) [Option A text]
B) [Option B text]
C) [Option C text]
D) [Option D text]
**Correct Answer:** [A, B, C, or D]
**Explanation:** [Detailed solution and explanation]`;

    const gemmaRaw = await gemmaService.predict(promptForGemma);

    // Use universal parser (handles both Markdown and JSON from Gemma)
    const questions = parseGemmaQuiz(gemmaRaw, subject, topic, level, parsedCount);

    res.json({
      subject,
      topic,
      level,
      difficulty,
      questions,
    });
  } catch (error: any) {
    const isConn = isGradioConnectionError(error);
    const statusCode = isConn ? 503 : 502;
    console.error(`[API Quiz Error - HTTP ${statusCode}]`, error.message);
    res.status(statusCode).json({
      error: error.message || 'Failed to generate quiz with Gemma model.',
    });
  }
});

// 4. AI Answer Evaluator
app.post('/api/ai/evaluate', async (req: Request, res: Response) => {
  try {
    const {
      question,
      studentAnswer,
      subject = 'General Academic',
      examType = 'WAEC / WASSCE',
      level = 'SS1–SS3',
    } = req.body;

    if (!question || !studentAnswer) {
      res.status(400).json({ error: 'Both question and student answer are required.' });
      return;
    }

    const promptForGemma = `You are an experienced Nigerian Chief Examiner powered by Google Gemma 4 E2B Instruct.
Genuinely evaluate the student's attempted answer against the official examination question for ${examType} (${level} in ${subject}).

Examination Question:
${question}

Student's Attempted Answer:
${studentAnswer}

Please provide an authentic, rigorous academic marking evaluation:
1. State the Overall Score out of 10 marks (e.g. 7.5 / 10) and a Verdict (Excellent, Good Attempt, or Needs Improvement).
2. Rubric Breakdown: Award marks for Definition/Terminology, Mechanism/Working, Context/Units, and Presentation.
3. List the Identified Correct Points.
4. List the Missing Points and Omissions that cost marks in ${examType}.
5. Point out any Conceptual Mistakes.
6. Provide an A* Model Answer.
7. Provide Examiner Advice for the examination hall.`;

    const gemmaRaw = await gemmaService.predict(promptForGemma);

    const evaluationResult = parseGemmaEvaluation(
      gemmaRaw,
      question,
      studentAnswer,
      subject,
      examType,
      level
    );

    res.json(evaluationResult);
  } catch (error: any) {
    const isConn = isGradioConnectionError(error);
    const statusCode = isConn ? 503 : 502;
    console.error(`[API Evaluate Error - HTTP ${statusCode}]`, error.message);
    res.status(statusCode).json({
      error: error.message || 'Failed to evaluate answer with Gemma model.',
    });
  }
});

// Prevent unhandled /api requests from falling through to the frontend index.html
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: `API route ${req.method} ${req.path} not found.`,
  });
});

// ==========================================
// VITE DEV SERVER OR STATIC PROD SERVING
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (isProduction) {
    // Serve production static assets from dist
    app.use(express.static(distPath));

    // Return the React application's index.html for all non-API client routes
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api')) {
        res.status(404).json({ error: `API route ${req.method} ${req.path} not found.` });
        return;
      }
      const indexPath = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(500).send('Production build not found. Please run "npm run build" first.');
      }
    });
  } else {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StudyMate AI] Full-stack server running on port ${PORT} bound to 0.0.0.0`);
    console.log(`[StudyMate AI] Node Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(
      `[Google Gemma 4 Gradio Backend] ${
        getGemmaApiUrl() ? 'Gradio endpoint configured' : 'Gradio endpoint not configured (set GEMMA_API_URL)'
      }`
    );
  });
}

startServer();

export {
  parseGemmaQuiz,
  parseGemmaEvaluation,
  parseMarkdownQuizQuestions,
  validateQuestionCandidate,
  isGradioConnectionError,
  app,
};
