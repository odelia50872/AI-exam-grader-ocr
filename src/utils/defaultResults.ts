import { ExamAssessmentResult } from '../types';

export const DEFAULT_PYTHON_BRACKETS_RESULT: ExamAssessmentResult = {
  ocrBreakdown: {
    words: [
      { word: "CS", confidence: 0.99, page_number: 1, box_2d: [55, 134, 75, 175] },
      { word: "106B", confidence: 0.98, page_number: 1, box_2d: [55, 185, 75, 235] },
      { word: "-", confidence: 0.95, page_number: 1, box_2d: [55, 240, 75, 250] },
      { word: "Python", confidence: 0.99, page_number: 1, box_2d: [55, 255, 75, 315] },
      { word: "Exam", confidence: 0.98, page_number: 1, box_2d: [55, 320, 75, 365] },
      { word: "def", confidence: 0.99, page_number: 1, box_2d: [120, 134, 142, 170] },
      { word: "isValid(s:", confidence: 0.98, page_number: 1, box_2d: [120, 175, 142, 260] },
      { word: "str)", confidence: 0.97, page_number: 1, box_2d: [120, 265, 142, 305] },
      { word: "->", confidence: 0.96, page_number: 1, box_2d: [120, 310, 142, 335] },
      { word: "bool:", confidence: 0.98, page_number: 1, box_2d: [120, 340, 142, 385] },
      { word: "stack", confidence: 0.98, page_number: 1, box_2d: [150, 170, 172, 215] },
      { word: "=", confidence: 0.99, page_number: 1, box_2d: [150, 220, 172, 235] },
      { word: "[]", confidence: 0.98, page_number: 1, box_2d: [150, 240, 172, 260] },
      { word: "pairs", confidence: 0.97, page_number: 1, box_2d: [180, 170, 202, 215] },
      { word: "=", confidence: 0.99, page_number: 1, box_2d: [180, 220, 202, 235] },
      { word: '{\")\":', confidence: 0.96, page_number: 1, box_2d: [180, 240, 202, 280] },
      { word: '\'(\',', confidence: 0.97, page_number: 1, box_2d: [180, 285, 202, 315] },
      { word: '\"]\":', confidence: 0.96, page_number: 1, box_2d: [180, 320, 202, 355] },
      { word: '\'[\',', confidence: 0.97, page_number: 1, box_2d: [180, 360, 202, 390] },
      { word: '\"}\":', confidence: 0.96, page_number: 1, box_2d: [180, 395, 202, 430] },
      { word: '\'{\'}', confidence: 0.97, page_number: 1, box_2d: [180, 435, 202, 465] },
      { word: "for", confidence: 0.99, page_number: 1, box_2d: [210, 170, 232, 200] },
      { word: "ch", confidence: 0.98, page_number: 1, box_2d: [210, 205, 232, 225] },
      { word: "in", confidence: 0.99, page_number: 1, box_2d: [210, 230, 232, 250] },
      { word: "s:", confidence: 0.98, page_number: 1, box_2d: [210, 255, 232, 275] },
      { word: "if", confidence: 0.99, page_number: 1, box_2d: [240, 210, 262, 230] },
      { word: "ch", confidence: 0.98, page_number: 1, box_2d: [240, 235, 262, 255] },
      { word: "in", confidence: 0.99, page_number: 1, box_2d: [240, 260, 262, 280] },
      { word: "pairs.values():", confidence: 0.96, page_number: 1, box_2d: [240, 285, 262, 385] },
      { word: "stack.append(ch)", confidence: 0.97, page_number: 1, box_2d: [270, 250, 292, 380] },
      { word: "elif", confidence: 0.98, page_number: 1, box_2d: [300, 210, 322, 245] },
      { word: "ch", confidence: 0.98, page_number: 1, box_2d: [300, 250, 322, 270] },
      { word: "in", confidence: 0.99, page_number: 1, box_2d: [300, 275, 322, 295] },
      { word: "pairs:", confidence: 0.98, page_number: 1, box_2d: [300, 300, 322, 350] },
      { word: "if", confidence: 0.99, page_number: 1, box_2d: [330, 250, 352, 270] },
      { word: "not", confidence: 0.98, page_number: 1, box_2d: [330, 275, 352, 305] },
      { word: "stack", confidence: 0.98, page_number: 1, box_2d: [330, 310, 352, 350] },
      { word: "or", confidence: 0.99, page_number: 1, box_2d: [330, 355, 352, 375] },
      { word: "stack[-1]", confidence: 0.96, page_number: 1, box_2d: [330, 380, 352, 440] },
      { word: "!=", confidence: 0.98, page_number: 1, box_2d: [330, 445, 352, 465] },
      { word: "pairs[ch]:", confidence: 0.97, page_number: 1, box_2d: [330, 470, 352, 545] },
      { word: "retur", confidence: 0.95, page_number: 1, box_2d: [360, 290, 382, 335], isFlaggedMistake: true },
      { word: "False", confidence: 0.98, page_number: 1, box_2d: [360, 340, 382, 380] },
      { word: "stack.pop()", confidence: 0.97, page_number: 1, box_2d: [390, 250, 412, 335] },
      { word: "return", confidence: 0.99, page_number: 1, box_2d: [420, 170, 442, 220] },
      { word: "len(stack)", confidence: 0.97, page_number: 1, box_2d: [420, 225, 442, 305] },
      { word: "==", confidence: 0.99, page_number: 1, box_2d: [420, 310, 442, 330] },
      { word: "0", confidence: 0.98, page_number: 1, box_2d: [420, 335, 442, 350] },
    ],
    transcribedFullText: `def isValid(s: str) -> bool:
    stack = []
    pairs = {")": "(", "]": "[", "}": "{"}
    for ch in s:
        if ch in pairs.values():
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                retur False
            stack.pop()
    return len(stack) == 0`
  },
  gradingEvaluation: {
    calculatedScore: 19,
    maximumPoints: 20,
    percentage: 95,
    letterGrade: "A",
    exactTranscribedCode: `def isValid(s: str) -> bool:
    stack = []
    pairs = {")": "(", "]": "[", "}": "{"}
    for ch in s:
        if ch in pairs.values():
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                retur False
            stack.pop()
    return len(stack) == 0`,
    syntaxDeductions: [
      {
        lineNumber: 8,
        issue: "Typo: 'retur' instead of 'return'",
        deduction: 1,
        explanation: "Small spelling error in the return keyword.",
        codeSnippet: "retur False",
        location: "retur",
        pageNumber: 1
      }
    ],
    logicalDeductions: [],
    quickFeedback: "Excellent implementation with optimal stack-based matching logic; fix the minor return typo on line 8 to make it fully executable.",
    feedback: "Excellent implementation with optimal stack-based matching logic; fix the minor return typo on line 8 to make it fully executable."
  }
};

export const DEFAULT_DIJKSTRA_RESULT: ExamAssessmentResult = DEFAULT_PYTHON_BRACKETS_RESULT;
