import { SampleExam } from '../types';

export const SAMPLE_EXAMS: SampleExam[] = [
  {
    id: 'py-brackets-code',
    subject: 'Computer Science: Python',
    title: 'Python: Valid Parentheses & Stack (Code Exam)',
    prompt: 'Question 1 (20 pts):\nWrite a Python function `isValid(s: str) -> bool` that determines whether an input string of brackets `()[]{}` is valid using a LIFO stack. The string is valid if open brackets close in the correct order and every close bracket has a matching open bracket of the same type.',
    referenceSolution: `def isValid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    return len(stack) == 0`,
    maxPoints: 20,
    scoringGuidelines: 'Fair & Balanced Evaluation: Award majority points for choosing a Stack and implementing matching logic. Deduct 1 point ONLY for minor syntax typo ("retur" instead of "return"). Do NOT penalize valid Python syntax. Deduct 1 to 2 pts maximum for minor logic/API adjustments. Focus on positive reinforcement.',
    pages: [
      {
        pageNumber: 1,
        title: 'Page 1: Python Function Implementation',
        text: `CS 106B - Python Programming Exam
Student: Sarah Connor | Topic: Valid Parentheses

def isValid(s: str) -> bool:
    stack = []
    pairs = {")": "(", "]": "[", "}": "{"}
    for ch in s:
        if ch in pairs.values():
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                retur False
            stack.pop()
    return len(stack) == 0

# Test note: Handled stack emptiness check.
# Typo on line 9: 'retur' instead of 'return'.`,
      },
    ],
    accentColor: '#10b981',
    icon: 'Code',
  },
  {
    id: 'cs-brackets',
    subject: 'Computer Science: Algorithms',
    title: 'Balanced Brackets & Stack Algorithm (Theory)',
    prompt: 'Question 1 (20 pts):\nDesign an algorithm to determine if an input string containing parentheses, brackets, and braces (), [], {} is balanced. Explain the data structure used, the push/pop conditions, time complexity, and how edge cases (such as unmatched closing brackets or remaining open brackets) are handled.',
    referenceSolution: '1. Data Structure: Use a Last-In First-Out (LIFO) Stack.\n2. Algorithm: Iterate through each character in the string. If it is an opening bracket ((, [, {), push it onto the stack. If it is a closing bracket (), ], }), check if the stack is empty (if so, return false). Pop top element and verify it matches the corresponding opening bracket type; if not, return false.\n3. End Condition: After string traversal, string is balanced if and only if stack is empty.\n4. Complexity: O(N) time where N is string length, and O(N) auxiliary space in the worst case.',
    maxPoints: 20,
    scoringGuidelines: 'Generous partial credit: 6 pts for identifying stack LIFO structure, 6 pts for push/pop matching conditions, 4 pts for empty stack edge-case checks, 4 pts for O(N) complexity analysis. Deduct 1 pt max for minor syntax typo.',
    pages: [
      {
        pageNumber: 1,
        title: 'Page 1: Stack Architecture & Matching Rules',
        text: `CS 202 - Data Structures Midterm
Student: Maya Lin | Topic: Bracket Matching

Q1. Bracket Balancing Algorithm:
We can solve this problem efficiently using a Stack data structure (LIFO - Last In First Out).

Algorithm Procedure:
1. Initialize an empty stack of characters.
2. For each char c in string:
   - If c is an opening bracket '(', '[', or '{', push it to the stack.
   - If c is a closing bracket ')', ']', or '}':
     - If stack is empty, return false (unmatched closing bracket).
     - Pop the top bracket from stack.
     - Check if top matches current closing bracket. If mismatched, return false.
3. At the end of the string:
   - Return true if stack is empty, otherwise return false.

Time Complexity: O(N) where N is length of string because each char is pushed and popped at most once.
Space Complexity: O(N) in worst case (e.g. all opening brackets).`,
      },
    ],
    accentColor: '#06b6d4',
    icon: 'Layers',
  },
  {
    id: 'cs-dijkstra',
    subject: 'Computer Science',
    title: 'Shortest Path & Dijkstra Algorithm',
    prompt: 'Question 1 (20 pts):\nExplain Dijkstra\'s single-source shortest path algorithm. State its time complexity when implemented with a min-priority queue (binary heap), and explain whether it functions correctly on graphs containing negative edge weights.',
    referenceSolution: '1. Core Idea: Maintains tentative distances from source to all vertices. Repeatedly extracts the unvisited vertex with minimum tentative distance and relaxes its adjacent outgoing edges until all reachable vertices are visited.\n2. Time Complexity: O((V + E) log V) with a binary heap, where V is vertex count and E is edge count.\n3. Negative Edges: Dijkstra\'s fails with negative weights because once a vertex is marked visited, its distance is assumed finalized (greedy choice property). A negative edge encountered later could yield a shorter path, violating the invariant.',
    maxPoints: 20,
    scoringGuidelines: 'Deduct 1 pt max for spelling/syntax mistakes (e.g. complxity). Deduct 2-3 pts for minor logic flaws. Award generous partial credit for correctly identifying the min-priority queue and relaxation steps. Strongly praise clear explanation of time complexity and relaxation!',
    pages: [
      {
        pageNumber: 1,
        title: 'Page 1: Algorithm Overview & Relaxation',
        text: `Exam: CS 301 - Final Exam
Student ID: #88412 | Name: David Chen

Q1. Dijkstra Algorithm Explanation:
Dijkstras algorithm finds the shortest path from a starting source node to all other nodes in a directed or undirected graph.
It uses a min-priority queue to keep track of unvisited nodes sorted by their tentative distances.
At each step, we extract the vertex with the lowest distance and perform edge relaxation:
if dist[u] + weight(u, v) < dist[v], then we update dist[v] = dist[u] + weight(u, v).

Time complxity: With a binary heap priority queue, the running time is O((V + E) log V).
Regarding negative edges: Dijkstra works fine even if edge weights are negative as long as there are no negative cycles.

Summary: Efficient greedy search algorithm.`,
      },
      {
        pageNumber: 2,
        title: 'Page 2: Complexity Derivation & Heap Operations',
        text: `CS 301 Final - Page 2
Student ID: #88412 | Question 1 Continued

Priority Queue Operations Breakdown:
1. Building initial heap takes O(V) time.
2. Extract-Min is called V times, each taking O(log V) time -> O(V log V).
3. Decrease-Key (relaxation) is performed at most E times -> O(E log V).
Total Running Time: O(V log V + E log V) = O((V + E) log V).

Space Complexity:
- Distance array: O(V)
- Priority queue: O(V)
- Total extra space: O(V).

Conclusion: Optimal algorithm for non-negative weighted graphs.`,
      },
    ],
    accentColor: '#3b82f6',
    icon: 'Network',
  },
  {
    id: 'physics-incline',
    subject: 'Physics: Mechanics',
    title: 'Frictionless Incline & Newton\'s 2nd Law',
    prompt: 'Problem 3 (25 pts):\nA wooden block with mass m = 5.0 kg is released from rest on a frictionless ramp inclined at θ = 30° above the horizontal. Assume g = 9.8 m/s².\n(a) Draw or describe the free-body forces acting on the block.\n(b) Calculate the acceleration of the block down the ramp.\n(c) Calculate the normal force exerted by the ramp on the block.',
    referenceSolution: '(a) Forces: Gravity (W = mg downwards) and Normal force (N perpendicular to ramp surface).\n(b) Acceleration: Component of gravity along incline is mg sin(θ). F_net = ma => m g sin(θ) = m a => a = g sin(30°) = 9.8 * 0.5 = 4.9 m/s².\n(c) Normal force: Perpendicular equilibrium => N = mg cos(θ) = 5.0 * 9.8 * cos(30°) = 49 * 0.8660 = 42.44 N (or ~42.4 N).',
    maxPoints: 25,
    scoringGuidelines: 'Award up to 10 pts for correct FBD & equation setup. Award 8 pts for acceleration calculation. Award 7 pts for normal force calculation. Deduct 1 pt max for unit notation omission. Celebrate complete work with high praise!',
    pages: [
      {
        pageNumber: 1,
        title: 'Page 1: Free Body Forces & Acceleration',
        text: `Physics 101 Midterm Exam
Name: Alex Mercer | Mass m = 5kg, θ = 30 deg

Part a) Forces acting on block:
- Gravity force pointing straight down: Fg = m * g
- Normal force perpendicular to the ramp surface: Fn

Part b) Acceleration:
Sum of forces along the incline = m * a
mg * sin(30) = m * a
a = g * sin(30) = 9.8 * 0.5 = 4.9 m/s^2

Part c) Normal Force Fn:
Fn = m * g * cos(30)
Fn = 5 * 9.8 * 0.866 = 42.44
Final Answer: 42.44 Newtons`,
      },
    ],
    accentColor: '#10b981',
    icon: 'Atom',
  },
  {
    id: 'chem-equilibrium',
    subject: 'Chemistry',
    title: 'Haber-Bosch & Le Chatelier\'s Principle',
    prompt: 'Question 2 (20 pts):\nConsider the Haber process synthesis of ammonia: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) + 92 kJ (exothermic).\nExplain according to Le Chatelier\'s Principle the effect of:\n(a) Increasing temperature on equilibrium position and NH₃ yield.\n(b) Increasing overall system pressure.\n(c) Adding an iron catalyst.',
    referenceSolution: '(a) Because the forward reaction is exothermic (releases heat), increasing temperature shifts equilibrium to the left (endothermic direction) to absorb excess heat, thereby decreasing NH₃ yield.\n(b) Increasing pressure shifts equilibrium toward the side with fewer moles of gas (left has 1+3=4 moles, right has 2 moles). Thus it shifts to the right, increasing NH₃ yield.\n(c) Adding an iron catalyst increases the rate of both forward and reverse reactions equally by lowering activation energy. It speeds up reaching equilibrium but does NOT shift the equilibrium position or change the yield.',
    maxPoints: 20,
    scoringGuidelines: 'Lenient grading. 6 pts for temperature effect, 7 pts for pressure mole explanation, 7 pts for catalyst explanation. Deduct 1 pt max for minor phrasing or typo.',
    pages: [
      {
        pageNumber: 1,
        title: 'Page 1: Le Chatelier Principles',
        text: `Chemistry AP - Exam 2
Student: Jordan Taylor

Q2: Haber Process N2(g) + 3H2(g) <=> 2NH3(g) (ΔH < 0)

(a) Effect of Temperature:
Since the forward reaction is exothermic, heat is a product.
Raising the temperature causes the system to shift left towards the reactants to absorb added heat.
Therefore, the yield of NH3 decreases.

(b) Effect of Pressure:
Reactants side has 1 + 3 = 4 moles of gas.
Product side has 2 moles of gas.
Increasing pressure shifts the equilibrium towards the side with fewer gas molecules (to the right).
This increases the NH3 yield.

(c) Iron Catalyst:
A catalyst lowers the activation energy so equilibrium is reached much faster. It does not alter the equilibrium constant or the final yield.`,
      },
    ],
    accentColor: '#8b5cf6',
    icon: 'FlaskConical',
  },
  {
    id: 'math-calculus',
    subject: 'Calculus',
    title: 'Chain Rule & Logarithmic Differentiation',
    prompt: 'Problem 4 (15 pts):\nGiven the function f(x) = ln(3x² + 5x), find the first derivative f\'(x) using the chain rule, and calculate the exact numerical value of f\'(2).',
    referenceSolution: 'Let u = 3x² + 5x, so f(u) = ln(u).\nBy chain rule: f\'(x) = (1/u) * u\'(x) = (6x + 5) / (3x² + 5x).\nEvaluating at x = 2:\nNumerator: 6(2) + 5 = 12 + 5 = 17.\nDenominator: 3(2)² + 5(2) = 3(4) + 10 = 12 + 10 = 22.\nExact value: f\'(2) = 17/22 (~0.7727).',
    maxPoints: 15,
    scoringGuidelines: '8 pts for correct general derivative formula (6x+5)/(3x²+5x). 7 pts for exact substitution at x=2. Deduct 1 pt max if reduced form has minor arithmetic slip.',
    pages: [
      {
        pageNumber: 1,
        title: 'Page 1: Derivation & Evaluation',
        text: `Calculus I Quiz 4
Name: Samantha Cole | Section B

Problem 4:
f(x) = ln(3x^2 + 5x)
Use chain rule: d/dx [ln(u)] = (1/u) * du/dx
Let u = 3x^2 + 5x
u' = 6x + 5

So f'(x) = (6x + 5) / (3x^2 + 5x)

Now evaluate at x = 2:
f'(2) = [6(2) + 5] / [3(2)^2 + 5(2)]
Numerator = 12 + 5 = 17
Denominator = 3(4) + 10 = 12 + 10 = 22
f'(2) = 17/22`,
      },
    ],
    accentColor: '#f59e0b',
    icon: 'Calculator',
  },
];

/**
 * Creates a realistic handwritten exam paper on a Canvas and returns a base64 Data URL.
 */
export function generateHandwrittenExamCanvas(
  text: string,
  title: string,
  subject: string,
  pageNumber: number = 1,
  totalPages: number = 1
): string {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 1550;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Paper Background: warm aged off-white notebook paper
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, width, height);

  // Subtle paper grain/vignette
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 200, width / 2, height / 2, 900);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  gradient.addColorStop(1, 'rgba(235, 226, 212, 0.55)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Ruled College Lines (blue horizontal lines)
  const lineSpacing = 44;
  const startY = 160;
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(180, 205, 237, 0.65)';

  for (let y = startY; y < height - 60; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
  }

  // 3. Margin Lines (red vertical margin on the left)
  const marginX = 140;
  ctx.strokeStyle = 'rgba(239, 130, 130, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginX, 40);
  ctx.lineTo(marginX, height - 40);
  ctx.stroke();

  // Secondary thin margin line
  ctx.strokeStyle = 'rgba(239, 130, 130, 0.35)';
  ctx.beginPath();
  ctx.moveTo(marginX + 6, 40);
  ctx.lineTo(marginX + 6, height - 40);
  ctx.stroke();

  // 4. Header Details (Printed exam stamp or instructor box)
  ctx.fillStyle = '#64748b';
  ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`EXAM ASSESSMENT SHEET  •  ${subject.toUpperCase()}`, 160, 85);
  ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(title, 160, 115);

  // Page indicator badge in top right
  ctx.fillStyle = '#4f46e5';
  ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`PAGE ${pageNumber} OF ${totalPages}`, width - 230, 80);

  // Score box in top right
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(width - 240, 90, 180, 50);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('EXAMINER SCORE: ___ / ___', width - 225, 122);

  // 5. Handwritten text
  const lines = text.split('\n');
  let currentY = 205;

  ctx.fillStyle = '#1e3a8a'; // Deep ballpoint ink blue
  ctx.font = '600 28px "Caveat", "Comic Sans MS", cursive';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      currentY += lineSpacing;
      continue;
    }

    const words = line.split(' ');
    let currentX = 160;

    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      const wordWidth = ctx.measureText(word + ' ').width;

      // Wrap if line is too long
      if (currentX + wordWidth > width - 80) {
        currentY += lineSpacing;
        currentX = 160;
      }

      // Small natural baseline jitter to simulate genuine handwriting
      const jitterY = (Math.sin(i * 10 + w) * 1.8);
      const rotation = (Math.sin(w * 3) * 0.015);

      ctx.save();
      ctx.translate(currentX, currentY + jitterY);
      ctx.rotate(rotation);
      ctx.fillText(word, 0, 0);
      ctx.restore();

      currentX += wordWidth;
    }

    currentY += lineSpacing;
    if (currentY > height - 80) break;
  }

  // Stamp / Teacher signature line at the bottom
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Official Student Submission Scan • Page ${pageNumber} of ${totalPages}`, width / 2 - 140, height - 35);

  return canvas.toDataURL('image/png');
}
