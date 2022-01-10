type SchemeNumber = number; // A scheme number will be implemented as javascript number
type SchemeString = string; // A scheme string will be implemented as javascript string
type SchemeSymbol = string; // A scheme symbol is a string that doesn't start with "
type SchemeEnv = { table: any; outer: SchemeEnv; name: string };
type SchemeProc = { parms: []; body: any; env: SchemeEnv };
type Atom = SchemeNumber | SchemeString | SchemeSymbol;
type Expression = Atom | SchemeProc | Array<Expression>;

/**
 * Converts a string of characters into a list of tokens.
 */
export function tokenize(text: string): string[] {
  const isEmpty = (s: string) =>
    s === "" || s === "\n" || s === "\t" || s === "\r\n";
  return text.replaceAll("(", " ( ").replaceAll(")", " ) ").replaceAll("\n", " " ).replaceAll("\t", " ")
             .split(" ").filter((s) => !isEmpty(s));
}

/**
 * Reads an expression from a sequence of tokens.
 */
export function parseTokens(tokens: string[]): Expression {
  if (tokens.length === 0) throw SyntaxError("unexpected EOF");
  else {
    const token = tokens.shift(); // pops first token
    if (token === "(") {
      const L = [];
      while (tokens[0] !== ")") L.push(parseTokens(tokens));
      tokens.shift();
      return L;
    } else if (token === ")") throw SyntaxError("unexpected )");
    // @ts-ignore: token will always have a value as we checked for non-empty array
    else return atom(token);
  }
}

/**
 * Numbers become numbers; otherwise, token is either a symbol or a string.
 * Will have to differentiate between symbols and strings later
 */
function atom(token: string): Atom {
  const parsed = Number(token);
  return isNaN(parsed) ? String(token) : parsed;
}

// Creating an environment object
/**
 * An environment: a mapping of {'name':val} pairs, with a reference to an outer Env
 */
export function createEnv(table = {}, outer = {}): SchemeEnv {
  //@ts-ignore: outer can be empty in the global environment
  return { table, outer };
}

/**
 * Finds the innermost Env where name appears
 */
export function searchEnv(name: string, env: SchemeEnv): SchemeEnv {
  const value = env.table[name];
  return typeof value === "undefined" ? searchEnv(name, env.outer) : env;
}

// Creating a procedure object
/**
 * A user-defined Scheme procedure.
 */
function createProc(parms: Array<any>, body: {}, env: SchemeEnv) {
  function call(...args: any) {
    const newEnv = createEnv(zip(parms, args), env);
    return evaluate(body, newEnv);
  }
  return call;
}

/**
 * Zips two arrays of keys and values to an object
 */
function zip(a1: Array<any>, a2: Array<any>) {
  const result = a1.reduce((acc, k, i) => (acc[k] = a2[i], acc), {});
  return result;
}

// Building a basic Scheme environment
/**
 * An environment with some Scheme standard procedures.
 */
function standardEnv(): SchemeEnv {
  const env = createEnv(Math); // sin, cos, sqrt, pi, ...

  // Arithemitc operators
  env.table["+"] = (...array: any) =>
    array.reduce((x: number, y: number) => x + y, 0);
  env.table["*"] = (...array: any) =>
    array.reduce((x: number, y: number) => x * y, 1);
  env.table["-"] = (x: number, y: number) => x - y;
  env.table["/"] = (x: number, y: number) => x / y;
  env.table[">"] = (x: number, y: number) => x > y;
  env.table[">="] = (x: number, y: number) => x >= y;
  env.table["<"] = (x: number, y: number) => x < y;
  env.table["<="] = (x: number, y: number) => x <= y;
  env.table["="] = (x: number, y: number) => x === y;

  // list operators 1
  env.table["list"] = (...args: any) => Array(args).pop();
  env.table["car"] = (l: any) => l[0];
  env.table["cdr"] = (l: any) => l.slice(1);
  env.table["cons"] = (x: any, y: any) => [x, y];
  env.table["append"] = (l: any, i: any) => [...l, i];

  // list operators 2
  env.table["map"] = (func: any, list: []) => list.map(func);
  env.table["filter"] = (func: any, list: []) => list.filter(func);
  env.table["reduce"] = (func: any, list: [], initial: any) =>
    list.reduce(func, initial);

  // type checks
  env.table["null?"] = (x: []) => x.length == 0;
  env.table["number?"] = (x: any) => typeof x == "number";
  env.table["procedure?"] = (x: any) => typeof x == "function";
  env.table["symbol?"] = (x: any) => typeof x == "string" && !x.startsWith("");
  env.table["string?"] = (x: any) => typeof x == "string" && x.startsWith("");
  env.table["list?"] = (l: any) => Array.isArray(l);

  // boolean functions
  env.table["and"] = (...list: []) => list.reduce((x, y) => x && y, true);
  env.table["or"] = (...list: []) => list.reduce((x, y) => x || y, false);
  env.table["not"] = (x: boolean) => !x;
  env.table["equal?"] = (x: any, y: any) => x ===y;

  // misc
  env.table["print"] = console.log
  env.table["begin"] = (...l: any) => l[l.length - 1];
  env.table["apply"] = (proc: Function, args: []) => proc(...args);

  return env;
}

export const globalEnv = standardEnv();

function typeOf(expression: Expression): string {
  if (typeof expression == "function") return "procedure";
  else if (typeof expression == "number") return "number";
  else if (typeof expression == "string" && !expression.startsWith('"')) {
    return "symbol";
  } // string literal, note that strings can't contain empty spaces given limitation with parser
  else if (typeof expression == "string" && expression.startsWith('"')) {
    return "string";
  } else if (Array.isArray(expression)) return "list";
  else throw TypeError("Unkown type");
}

// Evaluation and Application
/**
 * Evaluates an expression in an environment.
 */
function evaluate(exp: any, env = globalEnv, verbose = false): Expression {
  if (verbose) console.log("EVAL EXP", exp);
  switch (typeOf(exp)) {
    case "number": return exp;
    case "string": return exp.slice(1, -1);
    case "symbol": return searchEnv(exp, env).table[exp];
    case "list":   
    {
      const [operator, ...args] = exp
      return apply(operator, args, env);
    }
    default:
      throw SyntaxError("Unexpected Expression");
  }
}

function apply(operator: Expression, args: Array<Expression>, env: SchemeEnv, verbose=false) {
  if (verbose) console.log("APPLY OPERATOR", operator, "TO ARGS", args);
  switch (operator) {
    case "quote":
      return args[0];
    case "if": {
      const [test, conseq, alt] = args;
      const predicate = evaluate(test, env);
      const exp = predicate ? conseq : alt;
      return evaluate(exp, env);
    }
    case "define": {
      const [symbol, definition] = args;
      //@ts-ignore -
      env.table[symbol] = evaluate(definition, env);
      return null;
    }
    case "set!": {
      const [symbol, definition] = args;
      //@ts-ignore -
      searchEnv(symbol, env).table[symbol] = evaluate(definition, env);
      return null;
    }
    case "lambda": {
      const [parms, body] = args;
      //@ts-ignore -
      return createProc(parms, body, env);
    }
    default: { // procedure call
      const proc = evaluate(operator, env);
      const vals = args.map((arg) => evaluate(arg, env));
      //@ts-ignore-
      return proc(...vals);
    }
  }
}

function exe(program: string, verbose = false) {
  return evaluate(parseTokens(tokenize(program)), globalEnv, verbose);
}

const fact10 = `
(begin
  (define fact (lambda (n) (if (<= n 1) 1 (* n (fact (- n 1))))))
  (fact 10)
)`;

const fibs10 = `
(begin 
  (define fib (lambda (n) (if (< n 2) 1 (+ (fib (- n 1)) (fib (- n 2))))))
  (fib 10)
)`;

const towers3 = `
(begin 
  (define move (lambda (n from to spare)
    (if 
      (= 0 n) "Done_Moving"
      (begin 
        (move (- n 1) from spare to)
        (print "Move" n "from" from "to" to)
        (move (- n 1) spare to from)
      )
    ))
)
  (move 3 "One" "Three" "Two")
)`;

const sqrt2 = `
(begin
  (define threshold 1e-6)
  (define dx 1e-3)

  (define newton (lambda (f guess)
    (fixed-point (lambda (x) (- x (/ (f x) ((derive f dx) x)))) guess)))

  (define derive (lambda (f dx)
    (lambda (x) (/ (- (f (+ x dx)) (f x)) dx))))

  (define close-enough? (lambda (x y)
    (< (abs (- x y)) threshold)))
    
  (define fixed-point (lambda (f n)
    (if (close-enough? n (f n))
        n
        (fixed-point f (f n)))))

  (define jazr (lambda (y)
    (newton (lambda (x) (- y (* x x)))  1.0)))

  (jazr 2)
)`;

const symbdiff = `
(begin 
  (define deriv (lambda (exp var)
    (if (constant? exp var) 0
        (if  (same-var? exp var) 1
             (if (sum? exp) (make-sum (deriv (a1 exp) var) (deriv (a2 exp) var))
                 (if (product? exp) (make-sum
                           (make-product (m1 exp) (deriv (m2 exp) var))
                           (make-product (m2 exp) (deriv (m1 exp) var)))
                     "ERROR"))))))
         
  (define atomic? (lambda (exp) (not (list? exp))))

  (define constant? (lambda (exp var) (and (atomic? exp) (not (equal? exp var)))))

  (define same-var? (lambda (exp var) (and (atomic? exp) (equal? exp var))))

  (define sum? (lambda (exp) (and (list? exp) (equal? (car exp) (quote +)))))

  (define product? (lambda (exp) (and (list? exp) (equal? (car exp) (quote *)))))

  (define make-sum (lambda (a1 a2)
    (if (equal? a1 0) a2
        (if (equal? a2 0) a1
            (list (quote +) a1 a2)))))
  
  (define make-product (lambda (m1 m2)
    (if (equal? m1 1) m2
        (if (equal? m2 1) m1
            (if (or (equal? m1 0) (equal? m2 0)) 0
                (list (quote *) m1 m2))))))

  (define a1 (lambda (l) (car (cdr l))))

  (define a2 (lambda (l) (car (cdr (cdr l)))))

  (define m1 a1)

  (define m2 a2)

  (define diff (deriv (quote (+ (* x x) (* 2 x))) (quote x)))

  diff
)`

console.log(exe(fact10))
console.log(exe(fibs10))
console.log(exe(sqrt2))
console.log(exe(symbdiff))
console.log(exe(towers3))