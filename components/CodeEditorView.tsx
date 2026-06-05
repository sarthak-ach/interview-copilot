import React, { useState, useEffect, useRef } from "react";
import {
  Code,
  Terminal,
  Sparkles,
  Award,
  Play,
  Save,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type Challenge = {
  name: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  inputFormat: string;
  outputFormat: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  javaTemplate: string;
  jsTemplate: string;
};

const codingChallenges: Record<string, Challenge> = {
  "Two Sum": {
    name: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    inputFormat: "nums = int[], target = int",
    outputFormat: "int[]",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]"
      }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    javaTemplate: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your Java code here
        return new int[]{};
    }
}`,
    jsTemplate: `function twoSum(nums, target) {
    // Write your JavaScript code here
    return [];
}`
  },
  "Valid Parentheses": {
    name: "Valid Parentheses",
    difficulty: "Easy",
    description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    inputFormat: "s = String",
    outputFormat: "boolean",
    examples: [
      {
        input: "s = \"()\"",
        output: "true"
      },
      {
        input: "s = \"()[]{}\"",
        output: "true"
      },
      {
        input: "s = \"(]\"",
        output: "false"
      }
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only: '()[]{}'"
    ],
    javaTemplate: `class Solution {
    public boolean isValid(String s) {
        // Write your Java code here
        return false;
    }
}`,
    jsTemplate: `function isValid(s) {
    // Write your JavaScript code here
    return false;
}`
  },
  "Reverse String": {
    name: "Reverse String",
    difficulty: "Easy",
    description: "Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
    inputFormat: "s = char[]",
    outputFormat: "void (modify s in-place)",
    examples: [
      {
        input: "s = [\"h\",\"e\",\"l\",\"l\",\"o\"]",
        output: "[\"o\",\"l\",\"l\",\"e\",\"h\"]"
      }
    ],
    constraints: [
      "1 <= s.length <= 10^5",
      "s[i] is a printable ascii character."
    ],
    javaTemplate: `class Solution {
    public void reverseString(char[] s) {
        // Write your Java code here
        
    }
}`,
    jsTemplate: `function reverseString(s) {
    // Write your JavaScript code here
    
}`
  },
  "FizzBuzz": {
    name: "FizzBuzz",
    difficulty: "Easy",
    description: "Given an integer `n`, return a string array answer (1-indexed) where:\n- answer[i] == \"FizzBuzz\" if i is divisible by 3 and 5.\n- answer[i] == \"Fizz\" if i is divisible by 3.\n- answer[i] == \"Buzz\" if i is divisible by 5.\n- answer[i] == i (as a string) if none of the above conditions are true.",
    inputFormat: "n = int",
    outputFormat: "List<String> / String[]",
    examples: [
      {
        input: "n = 3",
        output: "[\"1\",\"2\",\"Fizz\"]"
      },
      {
        input: "n = 5",
        output: "[\"1\",\"2\",\"Fizz\",\"4\",\"Buzz\"]"
      }
    ],
    constraints: [
      "1 <= n <= 10^4"
    ],
    javaTemplate: `import java.util.List;
import java.util.ArrayList;

class Solution {
    public List<String> fizzBuzz(int n) {
        // Write your Java code here
        return new ArrayList<>();
    }
}`,
    jsTemplate: `function fizzBuzz(n) {
    // Write your JavaScript code here
    return [];
}`
  },
  "Custom Sandbox": {
    name: "Custom Sandbox",
    difficulty: "Medium",
    description: "Welcome to the custom coding workspace. Use this space to write and practice any algorithm, helper utility, or programming logic of your choice.\n\nType your code and hit 'Evaluate' to receive detailed AI analysis on syntax, time/space complexity, and code quality.",
    inputFormat: "N/A (Any signature)",
    outputFormat: "N/A",
    examples: [],
    constraints: [
      "Write comments or follow standard naming patterns to help the AI understand your goal.",
      "Ensure proper brackets and return structures matching your programming language."
    ],
    javaTemplate: `public class Main {
    public static void main(String[] args) {
        // Write your custom Java code here
        System.out.println("Hello, Interview Copilot!");
    }
}`,
    jsTemplate: `// Write your custom JavaScript code here
console.log("Hello, Interview Copilot!");`
  }
};

export function CodeEditorView() {
  const [selectedChallenge, setSelectedChallenge] = useState<string>("Two Sum");
  const [language, setLanguage] = useState<"Java" | "JavaScript">("JavaScript");
  const [code, setCode] = useState<string>("");
  const [lineCount, setLineCount] = useState<number>(1);

  // Status & loading indicators
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveTime, setSaveTime] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const activeChallenge = codingChallenges[selectedChallenge] || codingChallenges["Two Sum"];

  // Sync scroll between textarea and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Keep track of line numbers
  useEffect(() => {
    const lines = code.split("\n").length;
    setLineCount(lines || 1);
  }, [code]);

  // Load draft from backend on challenge or language change
  useEffect(() => {
    const fetchDraft = async () => {
      setSaveStatus("idle");
      try {
        const url = `/api/code-editor/draft?challengeName=${encodeURIComponent(selectedChallenge)}&language=${language}`;
        const data = await apiFetch(url);
        
        if (data.code && data.code.trim() !== "") {
          setCode(data.code);
        } else {
          // Fallback to template
          setCode(language === "Java" ? activeChallenge.javaTemplate : activeChallenge.jsTemplate);
        }
        setEvaluation(null);
      } catch (err) {
        console.error("Failed to load draft:", err);
        setCode(language === "Java" ? activeChallenge.javaTemplate : activeChallenge.jsTemplate);
      }
    };

    fetchDraft();
  }, [selectedChallenge, language]);

  // Handle saving to database
  const saveDraft = async (codeValue: string) => {
    setSaveStatus("saving");
    try {
      await apiFetch("/api/code-editor/draft/save", {
        method: "POST",
        bodyData: {
          challengeName: selectedChallenge,
          language,
          code: codeValue
        }
      });
      setSaveStatus("saved");
      const now = new Date();
      setSaveTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Failed to save draft:", err);
      setSaveStatus("error");
    }
  };

  // Debounced auto-save on code edits
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCode(val);

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    setSaveStatus("saving");
    autoSaveTimer.current = setTimeout(() => {
      saveDraft(val);
    }, 1200);
  };

  // Save on blur
  const handleBlur = () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    saveDraft(code);
  };

  // Handle key overrides (e.g. Tab inserts 4 spaces)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      const updatedVal = val.substring(0, start) + "    " + val.substring(end);
      setCode(updatedVal);

      // Restore cursor position on the next tick
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  // Run AI evaluation request
  const handleEvaluate = async () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    await saveDraft(code);
    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const result = await apiFetch("/api/code-editor/evaluate", {
        method: "POST",
        bodyData: {
          challengeName: selectedChallenge,
          language,
          code
        }
      });
      setEvaluation(result);
    } catch (err) {
      console.error("Evaluation request failed:", err);
      setEvaluation({
        score: 60,
        status: "WARNING",
        complexity: { time: "N/A", space: "N/A" },
        feedback: "Could not retrieve detailed AI assessment due to connection issue. Please retry.",
        suggestions: ["Check that the backend server is running and accessible."],
        testCases: [{ input: "N/A", expected: "N/A", actual: "N/A", passed: false }]
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Clear current draft and load default templates
  const handleReset = async () => {
    const template = language === "Java" ? activeChallenge.javaTemplate : activeChallenge.jsTemplate;
    setCode(template);
    setEvaluation(null);
    await saveDraft(template);
  };

  // Render side-by-side line numbers gutter contents
  const renderLineNumbers = () => {
    const numbers = [];
    for (let i = 1; i <= lineCount; i++) {
      numbers.push(
        <div key={i} className="h-6 leading-6 text-right pr-2 text-ink/30 select-none text-xs font-mono">
          {i}
        </div>
      );
    }
    return numbers;
  };

  return (
    <div className="space-y-6 flex flex-col flex-1 min-h-0">
      {/* Top challenge selection board */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-line bg-panel p-4 shadow-soft">
        <div className="min-w-0 flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-moss">Practice Arena</label>
          <div className="flex items-center gap-2 mt-0.5">
            <h4 className="text-lg font-bold text-ink truncate">{activeChallenge.name}</h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeChallenge.difficulty === "Easy" ? "bg-mint text-moss" : "bg-gold/10 text-amber-700"
            }`}>
              {activeChallenge.difficulty}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.keys(codingChallenges).map((name) => (
            <button
              key={name}
              onClick={() => {
                if (autoSaveTimer.current) {
                  clearTimeout(autoSaveTimer.current);
                }
                saveDraft(code);
                setSelectedChallenge(name);
              }}
              className={`px-3.5 h-9 rounded-lg border text-xs font-semibold transition ${
                selectedChallenge === name
                  ? "border-moss bg-mint text-moss"
                  : "border-line bg-shell/30 text-ink/75 hover:bg-shell"
              }`}
              type="button"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Workspace editor split pane */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] flex-1 min-h-[500px]">
        {/* Left Side: Challenge parameters & Evaluation scorecard */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Challenge Description panel */}
          <div className="rounded-xl border border-line bg-panel p-5 shadow-soft flex-1 flex flex-col">
            <h5 className="text-xs font-bold text-ink/80 uppercase pb-2.5 border-b border-line flex items-center gap-1.5">
              <BookOpen size={14} className="text-moss" /> Problem Description
            </h5>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 text-xs leading-relaxed text-ink/80">
              <p className="whitespace-pre-line font-medium text-ink">{activeChallenge.description}</p>

              {/* Input Output Format */}
              <div className="bg-shell/45 rounded-lg border border-line p-3 space-y-2 font-mono text-[11px]">
                <div>
                  <span className="text-moss font-bold">Input Format: </span>
                  <span className="text-ink/80">{activeChallenge.inputFormat}</span>
                </div>
                <div>
                  <span className="text-moss font-bold">Output Format: </span>
                  <span className="text-ink/80">{activeChallenge.outputFormat}</span>
                </div>
              </div>

              {/* Constraints */}
              {activeChallenge.constraints && activeChallenge.constraints.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-ink uppercase tracking-wider text-[10px]">Constraints:</span>
                  <ul className="list-disc pl-4 space-y-1 text-ink/75">
                    {activeChallenge.constraints.map((constraint, idx) => (
                      <li key={idx} className="font-mono text-[11px]">{constraint}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Examples */}
              {activeChallenge.examples && activeChallenge.examples.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="font-semibold text-ink uppercase tracking-wider text-[10px]">Examples:</span>
                  {activeChallenge.examples.map((ex, idx) => (
                    <div key={idx} className="rounded-lg border border-line/60 bg-shell/25 p-3 space-y-1.5 font-mono text-[11px]">
                      <div className="font-bold text-ink">Example {idx + 1}:</div>
                      <div><span className="text-ink/40">Input:</span> {ex.input}</div>
                      <div><span className="text-ink/40">Output:</span> {ex.output}</div>
                      {ex.explanation && (
                        <div className="text-ink/60 italic text-[10.5px] mt-1 border-t border-line/30 pt-1">
                          Explanation: {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI evaluation panel (if reports exist) */}
          {evaluation && (
            <div className="rounded-xl border border-line bg-panel p-5 shadow-soft animate-fadeIn">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <h5 className="text-xs font-bold text-ink/85 uppercase flex items-center gap-1.5">
                  <Award size={15} className="text-gold" /> Evaluation Report
                </h5>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                  evaluation.status === "PASS"
                    ? "bg-mint text-moss"
                    : evaluation.status === "WARNING"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-coral/15 text-coral"
                }`}>
                  {evaluation.status === "PASS" && <CheckCircle size={10} />}
                  {evaluation.status === "WARNING" && <AlertCircle size={10} />}
                  {evaluation.status === "FAIL" && <XCircle size={10} />}
                  {evaluation.status}
                </span>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                {/* Score and complexity row */}
                <div className="grid grid-cols-3 gap-3 bg-shell/55 p-3 border border-line rounded-lg">
                  <div className="text-center">
                    <p className="text-[10px] text-ink/50 uppercase font-bold">AI Score</p>
                    <p className="text-lg font-extrabold text-ink">{evaluation.score}%</p>
                  </div>
                  <div className="text-center border-x border-line/70">
                    <p className="text-[10px] text-ink/50 uppercase font-bold">Time Comp.</p>
                    <p className="text-xs font-mono font-bold mt-1 text-moss">{evaluation.complexity?.time || "N/A"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-ink/50 uppercase font-bold">Space Comp.</p>
                    <p className="text-xs font-mono font-bold mt-1 text-moss">{evaluation.complexity?.space || "N/A"}</p>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <h6 className="font-bold text-ink">Review Feedback:</h6>
                  <p className="text-ink/70 leading-relaxed mt-1">{evaluation.feedback}</p>
                </div>

                {/* Suggestions */}
                {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                  <div>
                    <h6 className="font-bold text-ink">Optimization Ideas:</h6>
                    <ul className="list-disc pl-4 space-y-1 text-ink/70 mt-1">
                      {evaluation.suggestions.map((sug: string, i: number) => (
                        <li key={i}>{sug}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Test case status list */}
                {evaluation.testCases && evaluation.testCases.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <h6 className="font-bold text-ink uppercase tracking-wider text-[9px] text-ink/60">AI Verification Checks:</h6>
                    <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1">
                      {evaluation.testCases.map((tc: any, i: number) => (
                        <div key={i} className="flex items-start justify-between p-2 rounded bg-shell/30 border border-line/50 text-[11px]">
                          <div className="font-mono min-w-0 flex-1">
                            <div><span className="text-ink/40">In:</span> {tc.input}</div>
                            <div><span className="text-ink/40">Exp:</span> {tc.expected} | <span className="text-ink/40">Act:</span> {tc.actual}</div>
                          </div>
                          <div className="shrink-0 ml-2">
                            {tc.passed ? (
                              <span className="text-moss font-bold flex items-center gap-0.5 bg-mint px-1.5 py-0.5 rounded text-[10px]">
                                Pass <CheckCircle size={10} />
                              </span>
                            ) : (
                              <span className="text-coral font-bold flex items-center gap-0.5 bg-coral/10 px-1.5 py-0.5 rounded text-[10px]">
                                Fail <XCircle size={10} />
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Code editor pane */}
        <div className="rounded-xl border border-line bg-panel p-5 shadow-soft flex flex-col justify-between">
          <div className="space-y-4 flex flex-col flex-1">
            {/* Header controls (Language dropdown, autosave indicators) */}
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-ink/60 font-bold uppercase">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="h-8 rounded border border-line bg-shell/45 px-2 text-xs font-semibold outline-none focus:border-moss"
                >
                  <option value="JavaScript">JavaScript</option>
                  <option value="Java">Java</option>
                </select>
              </div>

              {/* Status display */}
              <div className="flex items-center gap-1.5 text-[10px] text-ink/50 font-medium">
                {saveStatus === "saving" && (
                  <>
                    <Loader2 className="animate-spin text-moss" size={12} />
                    <span>Saving draft...</span>
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <div className="size-1.5 rounded-full bg-moss animate-pulse" />
                    <span>Autosaved {saveTime ? `at ${saveTime}` : ""}</span>
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    <div className="size-1.5 rounded-full bg-coral" />
                    <span className="text-coral">Save failed</span>
                  </>
                )}
                {saveStatus === "idle" && (
                  <>
                    <Clock size={12} />
                    <span>Idle</span>
                  </>
                )}
              </div>
            </div>

            {/* Custom line-numbered text area editor */}
            <div className="flex-1 flex rounded-lg border border-line bg-[#16201b] overflow-hidden min-h-[350px]">
              {/* Line Numbers Container */}
              <div
                ref={lineNumbersRef}
                className="w-10 bg-[#101714] border-r border-[#1a2822] py-3 overflow-hidden select-none flex flex-col"
              >
                {renderLineNumbers()}
              </div>

              {/* Editor Textarea */}
              <textarea
                ref={textareaRef}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                onChange={handleCodeChange}
                onBlur={handleBlur}
                value={code}
                placeholder={language === "Java" ? "// Write your Java code here" : "// Write your JavaScript code here"}
                className="flex-1 py-3 px-4 bg-transparent text-emerald-100 font-mono text-xs leading-6 outline-none resize-none overflow-y-auto whitespace-pre tab-size-4"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="flex items-center justify-between border-t border-line pt-3 mt-4">
            <button
              onClick={handleReset}
              className="px-3 h-9 rounded-lg border border-line bg-shell/30 text-ink/75 hover:bg-shell text-xs font-semibold transition"
              type="button"
            >
              Reset Code
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => saveDraft(code)}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-panel px-3 text-xs font-semibold text-ink hover:bg-shell transition"
                type="button"
                disabled={saveStatus === "saving"}
              >
                <Save size={13} />
                Save Draft
              </button>

              <button
                onClick={handleEvaluate}
                disabled={isEvaluating}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-ink px-4 text-xs font-semibold text-shell hover:bg-moss transition disabled:opacity-50"
                type="button"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="animate-spin" size={13} />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Play size={12} fill="currentColor" />
                    Evaluate Solution
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
