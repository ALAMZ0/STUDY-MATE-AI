import {
  parseGemmaQuiz,
  parseGemmaEvaluation,
  parseMarkdownQuizQuestions,
  validateQuestionCandidate,
  isGradioConnectionError,
} from '../server.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function assertThrows(fn: () => void, expectedSnippet: string, testName: string) {
  try {
    fn();
    console.error(`  ✗ FAIL: ${testName} - Did not throw`);
    failed++;
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes(expectedSnippet.toLowerCase())) {
      console.log(`  ✓ ${testName} (Threw expected: "${expectedSnippet}")`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} - Threw "${err.message}", expected snippet "${expectedSnippet}"`);
      failed++;
    }
  }
}

console.log('====================================================');
console.log('🧪 STUDYMATE AI — PRE-DEPLOYMENT TEST SUITE');
console.log('====================================================');

// --- 1. QUIZ QUESTION VALIDATION TESTS ---
console.log('\n[1] Testing Quiz Question Candidate Validation:');

// Test 1.1: 2-option question must be rejected (NO True/False fabrication)
const twoOptionCandidate = {
  prompt: 'What is Newton second law?',
  options: [
    { id: 'A', text: 'F = ma' },
    { id: 'B', text: 'E = mc^2' },
  ],
  correctAnswer: 'A',
  explanation: 'F = ma governs linear acceleration under applied net force.',
};
const res1_1 = validateQuestionCandidate(twoOptionCandidate, 0, 'Physics', 'SS1–SS3');
assert(res1_1 === null, 'Rejects question with fewer than 4 options (no True/False replacement)');

// Test 1.2: Valid 4-option question must be accepted
const validCandidate = {
  prompt: 'Factorise the quadratic expression: x^2 + 5x + 6',
  options: [
    { id: 'A', text: '(x + 2)(x + 3)' },
    { id: 'B', text: '(x - 2)(x - 3)' },
    { id: 'C', text: '(x + 1)(x + 6)' },
    { id: 'D', text: '(x + 5)(x + 1)' },
  ],
  correctAnswer: 'A',
  explanation: 'Two numbers that multiply to +6 and add to +5 are +2 and +3.',
};
const res1_2 = validateQuestionCandidate(validCandidate, 0, 'Mathematics', 'SS1–SS3');
assert(res1_2 !== null && res1_2.options.length === 4, 'Accepts valid 4-option question');
assert(res1_2?.correctAnswer === 'A', 'Correct answer preserved as A');

// Test 1.3: Question missing explanation must be rejected
const noExplanationCandidate = {
  prompt: 'What is the capital of Nigeria?',
  options: ['A) Abuja', 'B) Lagos', 'C) Kano', 'D) Ibadan'],
  correctAnswer: 'A',
  explanation: '',
};
const res1_3 = validateQuestionCandidate(noExplanationCandidate, 0, 'General', 'SS1–SS3');
assert(res1_3 === null, 'Rejects question missing explanation');

// Test 1.4: Question with invalid correct answer must be rejected
const invalidAnswerCandidate = {
  prompt: 'What is the speed of light in vacuum?',
  options: [
    { id: 'A', text: '3 x 10^8 m/s' },
    { id: 'B', text: '3 x 10^6 m/s' },
    { id: 'C', text: '3 x 10^5 m/s' },
    { id: 'D', text: '3 x 10^3 m/s' },
  ],
  correctAnswer: 'Z',
  explanation: 'The speed of light in vacuum is approx 300,000 km/s.',
};
const res1_4 = validateQuestionCandidate(invalidAnswerCandidate, 0, 'Physics', 'SS1–SS3');
assert(res1_4 === null, 'Rejects question with invalid correct answer ("Z")');

// --- 2. QUIZ PARSER INCOMPLETE / MALFORMED TESTS ---
console.log('\n[2] Testing Full Quiz Parsing & Count Validation:');

const rawMarkdownQuiz2Questions = `
## Question 1
**Question:** Factorise $x^2 + 5x + 6$
A) $(x + 2)(x + 3)$
B) $(x - 2)(x - 3)$
C) $(x + 1)(x + 6)$
D) $(x + 5)(x + 1)$
**Correct Answer:** A
**Explanation:** Factors of 6 that sum to 5 are 2 and 3.

## Question 2
**Question:** If $2x + 4 = 10$, find the value of $x$.
A) 3
B) 2
C) 5
D) 7
**Correct Answer:** A
**Explanation:** $2x = 10 - 4 = 6$, so $x = 3$.
`;

// Test 2.1: Model provided 2 valid questions, requested 2 -> Succeeds
const quiz2Of2 = parseGemmaQuiz(rawMarkdownQuiz2Questions, 'Mathematics', 'Algebra', 'SS1–SS3', 2);
assert(quiz2Of2.length === 2, 'Returns exactly 2 questions when 2 requested');

// Test 2.2: Model provided 2 valid questions, requested 5 -> Throws clear error instead of faking 3
assertThrows(
  () => parseGemmaQuiz(rawMarkdownQuiz2Questions, 'Mathematics', 'Algebra', 'SS1–SS3', 5),
  'Incomplete quiz generated',
  'Throws clear incomplete error when model generates fewer questions than requested'
);

// Test 2.3: Unparseable gibberish -> Throws clear error without inventing questions
assertThrows(
  () => parseGemmaQuiz('This is just general text about biology without questions.', 'Biology', 'Cells', 'SS1–SS3', 3),
  'Unable to extract valid 4-option',
  'Rejects unparseable quiz text without simulated question injection'
);

// --- 3. EVALUATION PARSER VALIDATION TESTS ---
console.log('\n[3] Testing Theory Answer Evaluation Parser:');

// Test 3.1: Missing score must NEVER default to 7.5
const noScoreEvaluation = `
The student explained the concept of osmosis well.
They described semipermeable membranes and concentration gradient.
Model Answer: Osmosis is net water movement across semipermeable membrane.
`;
assertThrows(
  () => parseGemmaEvaluation(noScoreEvaluation, 'Explain osmosis', 'Osmosis is water movement', 'Biology', 'WAEC', 'SS1–SS3'),
  'did not contain a recognizable score',
  'Refuses to assign a fake score (e.g. 7.5) when score is absent'
);

// Test 3.2: Score outside permitted range (> 10 or < 0) must be rejected
const outOfRangeEvaluation = `
Overall Score: 14 / 10
Verdict: Excellent
Model Answer: Correct answer.
`;
assertThrows(
  () => parseGemmaEvaluation(outOfRangeEvaluation, 'Question', 'Answer', 'Physics', 'WAEC', 'SS1–SS3'),
  'outside the permitted range',
  'Rejects score exceeding max score (14 / 10)'
);

// Test 3.3: Honest evaluation parsing: When rubric table is omitted, rubricBreakdown is [] (NO fabrication)
const genuineMarkdownEval = `
**Overall Score:** 8.5 / 10
**Verdict:** Good Attempt
**Correct Points:**
- Stated Newton second law formula correctly
- Substituted given mass and acceleration
**Missing Points:**
- Did not define impulse
**Model Answer:** The full derivation shows F = dp/dt.
**Examiner Advice:** Always state units clearly.
`;

const evalResult = parseGemmaEvaluation(
  genuineMarkdownEval,
  'State Newton second law',
  'F = ma',
  'Physics',
  'WAEC / WASSCE',
  'SS1–SS3'
);

assert(evalResult.totalScore === 8.5, 'Accurately parses authentic score: 8.5');
assert(evalResult.maxScore === 10, 'Accurately parses max score: 10');
assert(evalResult.percentage === 85, 'Accurately computes percentage: 85%');
assert(evalResult.verdict === 'Good Attempt', 'Preserves model verdict');
assert(Array.isArray(evalResult.rubricBreakdown) && evalResult.rubricBreakdown.length === 0, 'Rubric breakdown is honestly [] when omitted by model (no fake items)');
assert(evalResult.correctPoints.length === 2, 'Extracts genuine correct points (2 points)');
assert(evalResult.missingPoints.length === 1, 'Extracts genuine missing points (1 point)');
assert(evalResult.examinerTips.length === 1, 'Extracts genuine examiner tips');

// Test 3.4: JSON structured evaluation parsing
const jsonEvaluation = JSON.stringify({
  totalScore: 9,
  maxScore: 10,
  verdict: 'Excellent',
  rubricBreakdown: [
    { criterion: 'Definition & Terminology', awardedMarks: 4, totalMarks: 4, feedback: 'Precise definition' },
    { criterion: 'Mathematical Derivation', awardedMarks: 5, totalMarks: 6, feedback: 'Minor calculation slip' },
  ],
  correctPoints: ['Used correct quadratic formula'],
  missingPoints: ['Forgot negative root sign check'],
  modelAnswer: 'x = (-b ± √(b² - 4ac)) / 2a',
  examinerTips: ['Double check signs when b is negative'],
});

const jsonResult = parseGemmaEvaluation(
  jsonEvaluation,
  'Solve quadratic equation',
  'x = ...',
  'Mathematics',
  'WAEC / WASSCE',
  'SS1–SS3'
);
assert(jsonResult.totalScore === 9, 'Parses JSON totalScore: 9');
assert(jsonResult.percentage === 90, 'Parses JSON percentage: 90%');
assert(jsonResult.rubricBreakdown.length === 2, 'Preserves authentic JSON rubric breakdown (2 items)');
assert(jsonResult.rubricBreakdown[0].criterion === 'Definition & Terminology', 'First rubric criterion preserved');

// --- 4. GRADIO CONNECTION ERROR DETECTION TESTS ---
console.log('\n[4] Testing Gradio Connection vs Validation Error Classification:');

const networkErr = new Error('Unable to connect to Google Gemma 4 E2B Instruct on Kaggle: fetch failed');
assert(isGradioConnectionError(networkErr) === true, 'Classifies network timeout/connection error as Gradio connection error (HTTP 503)');

const parseErr = new Error('Unable to extract valid 4-option multiple-choice questions from the Gemma model response.');
assert(isGradioConnectionError(parseErr) === false, 'Classifies parser/validation error as model bad gateway error (HTTP 502)');

console.log('\n====================================================');
console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL UNIT AND VALIDATION TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
