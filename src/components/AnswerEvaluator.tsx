import React, { useState } from 'react';
import {
  FileCheck2,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Award,
  BookOpen,
  ArrowRight,
  RotateCcw,
  BookMarked,
  HelpCircle,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { SUBJECTS, EXAM_TYPES } from '../data/curriculumData';
import { aiService } from '../services/aiService';
import { EvaluationResult } from '../types';
import { MathText, FormattedContent } from './MathRenderer';

export const AnswerEvaluator: React.FC = () => {
  const {
    selectedSubject,
    setSelectedSubject,
    selectedLevel,
    recordEvaluationResult,
    evaluationHistory,
  } = useStudy();

  const currentSubjectInfo = SUBJECTS.find((s) => s.id === selectedSubject) || SUBJECTS[0];

  const [examType, setExamType] = useState<(typeof EXAM_TYPES)[number]>('WAEC / WASSCE');
  const [question, setQuestion] = useState(
    'Factorise the quadratic expression: $x^2 + 5x + 6$'
  );
  const [studentAnswer, setStudentAnswer] = useState(
    'By factoring the expression, two numbers that multiply to 6 and add to 5 are 2 and 3. So the factorised form is $(x + 2)(x + 3)$.'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedModel, setCopiedModel] = useState(false);

  // Curated sample exam questions for instant demonstration
  const samplePrompts = [
    {
      title: 'WAEC Maths (Quadratic Factorisation)',
      subject: 'mathematics' as const,
      exam: 'WAEC / WASSCE' as const,
      question:
        'Factorise the quadratic expression: $x^2 + 5x + 6$ and state the roots if $x^2 + 5x + 6 = 0$.',
      sampleAnswer:
        'To factorise $x^2 + 5x + 6$, we find factors of 6 that sum to 5: 2 and 3. Thus $x^2 + 5x + 6 = (x + 2)(x + 3)$. For roots: $x + 2 = 0 \\implies x = -2$ or $x + 3 = 0 \\implies x = -3$.',
    },
    {
      title: 'WAEC Biology (Osmosis & Membranes)',
      subject: 'biology' as const,
      exam: 'WAEC / WASSCE' as const,
      question:
        'Explain the process of osmosis in living cells and state two conditions necessary for it to occur.',
      sampleAnswer:
        'Osmosis is the movement of water molecules from a region of higher water potential to a region of lower water potential across a semipermeable membrane. Two conditions: difference in concentration gradient and a selectively permeable membrane.',
    },
    {
      title: 'WAEC Physics (Newton’s Laws & Momentum)',
      subject: 'physics' as const,
      exam: 'WAEC / WASSCE' as const,
      question:
        'State Newton’s second law of motion ($F = \\frac{dp}{dt}$) and explain how it relates to the conservation of linear momentum in an isolated system.',
      sampleAnswer:
        'Newton’s second law states that the rate of change of momentum is directly proportional to applied force ($F = ma$). When external force is zero, $\\Delta p = 0$, hence total linear momentum is conserved.',
    },
    {
      title: 'JAMB Economics (Inflation in Nigeria)',
      subject: 'economics' as const,
      exam: 'JAMB / UTME' as const,
      question:
        'Distinguish between demand-pull inflation and cost-push inflation, citing relevant factors affecting the Nigerian economy.',
      sampleAnswer:
        'Demand pull happens when aggregate demand exceeds supply ($AD > AS$). Cost push happens when cost of fuel, electricity tariffs, or FX exchange rates increase production costs.',
    },
  ];

  const handleLoadSample = (sample: (typeof samplePrompts)[0]) => {
    setSelectedSubject(sample.subject);
    setExamType(sample.exam);
    setQuestion(sample.question);
    setStudentAnswer(sample.sampleAnswer);
    setEvaluation(null);
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !studentAnswer.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await aiService.evaluateAnswer({
        question,
        studentAnswer,
        subject: currentSubjectInfo.name,
        examType,
        level: selectedLevel,
      });

      setEvaluation(result);
      recordEvaluationResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to evaluate answer. Please verify connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyModel = () => {
    if (!evaluation) return;
    navigator.clipboard.writeText(evaluation.modelAnswer);
    setCopiedModel(true);
    setTimeout(() => setCopiedModel(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="rounded-2xl bg-linear-to-b from-slate-900 to-slate-950 p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">AI Theory & Essay Answer Evaluator</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Rigorous rubric marking with WAEC & Nigerian university examiner rubrics powered by Google Gemma 4 E2B.
            </p>
          </div>
        </div>

        {/* Quick Sample Prompts */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Try a Sample Past Examination Question:
          </span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLoadSample(s)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/40 transition-colors"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Form Card */}
      <form
        onSubmit={handleEvaluate}
        className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5"
      >
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Subject & Target Exam */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Academic Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as any)}
              className="w-full bg-slate-950 text-white text-sm font-medium px-4 py-3 rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 cursor-pointer"
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Target Examination Board
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as any)}
              className="w-full bg-slate-950 text-white text-sm font-medium px-4 py-3 rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 cursor-pointer"
            >
              {EXAM_TYPES.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Examination Question */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            The Examination Question
          </label>
          <textarea
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type or paste the exam question here..."
            className="w-full bg-slate-950 text-white text-sm px-4 py-3 rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 resize-none"
            required
          />
        </div>

        {/* Student's Attempted Answer */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Your Attempted Answer
            </label>
            <span className="text-[11px] text-slate-500">
              {studentAnswer.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <textarea
            rows={5}
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
            placeholder="Write your answer as you would in an examination booklet..."
            className="w-full bg-slate-950 text-white text-sm px-4 py-3 rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 leading-relaxed resize-y"
            required
          />
        </div>

        {/* Submit Evaluation Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading || !question.trim() || !studentAnswer.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-amber-600/20 active:scale-99"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Marking with Gemma 4 E2B Instruct...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Evaluate Answer & Generate Rubric</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Evaluation Results Card */}
      {evaluation && (
        <div className="space-y-6">
          {/* Verdict and Score Hero */}
          <div className="rounded-2xl bg-linear-to-b from-slate-900 to-slate-950 p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {evaluation.examType} Official Grading
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Overall Score: <span className="text-amber-400 tabular-nums">{evaluation.totalScore}</span> / {evaluation.maxScore} marks
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Percentage: {evaluation.percentage}% · Verdict: <strong className="text-white">{evaluation.verdict}</strong>
                </p>
              </div>

              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border self-start sm:self-auto ${
                  evaluation.percentage >= 70
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                <Award className="h-4 w-4" />
                <span>{evaluation.verdict}</span>
              </div>
            </div>

            {/* Rubric Matrix Breakdown (rendered only if provided by Gemma) */}
            {evaluation.rubricBreakdown && evaluation.rubricBreakdown.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Marking Scheme Breakdown
                </h4>
                <div className="space-y-2">
                  {evaluation.rubricBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <MathText text={item.criterion} className="text-xs font-semibold text-white" />
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              item.status === 'achieved'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-amber-500/15 text-amber-400'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                        {item.feedback && (
                          <MathText text={item.feedback} as="p" className="text-[11px] text-slate-400" />
                        )}
                      </div>

                      <span className="text-xs font-bold text-white tabular-nums shrink-0 self-end sm:self-auto">
                        {item.awardedMarks} / {item.totalMarks} marks
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Correct Points vs Missing Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Correct Points */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4" />
                <span>Identified Correct Points</span>
              </div>
              {evaluation.correctPoints && evaluation.correctPoints.length > 0 ? (
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  {evaluation.correctPoints.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                      <div className="flex-1">
                        <MathText text={pt} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No specific correct points identified in the student's attempt.</p>
              )}
            </div>

            {/* Missing Information & Omissions */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <XCircle className="h-4 w-4" />
                <span>Missing Information (Lost Marks)</span>
              </div>
              {evaluation.missingPoints && evaluation.missingPoints.length > 0 ? (
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  {evaluation.missingPoints.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold shrink-0 mt-0.5">✗</span>
                      <div className="flex-1">
                        <MathText text={pt} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No critical syllabus omissions noted by the examiner.</p>
              )}
            </div>
          </div>

          {/* Model Answer from Gemma 4 */}
          {evaluation.modelAnswer && (
            <div className="p-6 rounded-2xl bg-blue-950/20 border border-blue-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  <span>Examiner’s Model Answer (Full Marks Standard)</span>
                </div>
                <button
                  onClick={handleCopyModel}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-white transition-colors"
                >
                  {copiedModel ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedModel ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                <FormattedContent content={evaluation.modelAnswer} />
              </div>
            </div>
          )}

          {/* Examiner's Hall Advice (rendered only if provided by Gemma) */}
          {evaluation.examinerTips && evaluation.examinerTips.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4" />
                <span>Examiner’s Practical Advice for {evaluation.examType}</span>
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {evaluation.examinerTips.map((tip, tIdx) => (
                  <li key={tIdx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold mt-0.5">·</span>
                    <div className="flex-1">
                      <MathText text={tip} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
