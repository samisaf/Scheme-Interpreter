// © 2022 Sami Safadi

type Environment = { table: any; outer: Environment;};
type Procedure = { parms: []; body: Blob; env: Environment };
type Atom = number | string; // A string can represent a symbol or a string. See typeOf function.
type Expression = Atom | Procedure | Expression[];

/**
 * Converts a string of characters into a list of tokens.
 */
export function tokenize(text: string): string[] {
  const isEmpty = (s: string) => s === "" || s === "\n" || s === "\t" || s === "\r\n";
  return text.replaceAll("(", " ( ").replaceAll(")", " ) ").replaceAll(/[\s\n\t]/g, " " ).split(" ").filter((s) => !isEmpty(s));
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
    // Numbers become numbers; otherwise, token is either a symbol or a string.
    else return isNaN(Number(token)) ? String(token) : Number(token);
  }
}

/**
 * Creates an environment object which is a mapping of {'name':val} pairs, with a reference to an outer Env
 */
export function createEnv(table: any, outer: Environment): Environment {
  return { table, outer };
}

/**
 * Finds the innermost Env where name appears
 */
export function searchEnv(name: string, env: Environment): Environment {
  const value = env.table[name];
  return typeof value === "undefined" ? searchEnv(name, env.outer) : env;
}

/**
 * Creates a user-defined Scheme procedure.
 */
function createProc(parms: Expression[], body: Expression, env: Environment) {
  function call(...args: Expression[]) {
    const newEnv = createEnv(zip(parms, args), env);
    return evaluate(body, newEnv);
  }
  return call;
}

/**
 * Zips two arrays of keys and values to an object
 */
export function zip(a1: Array<any>, a2: Array<any>) {
  return a1.reduce((acc, k, i) => (acc[k] = a2[i], acc), {});
}

/**
 * Builds an environment with some Scheme standard procedures.
 */
export function standardEnv(): Environment {
  const env = createEnv(Math, Object()); // sin, cos, sqrt, pi, ...
  // Arithemitc operators
  env.table["+"] = (...array: any) => array.reduce((x: number, y: number) => x + y, 0);
  env.table["*"] = (...array: any) => array.reduce((x: number, y: number) => x * y, 1);
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
  env.table["reduce"] = (func: any, list: [], initial: any) => list.reduce(func, initial);
  // type checks
  env.table["null?"] = (x: any) => x.length == 0;
  env.table["number?"] = (x: any) => typeof x == "number";
  env.table["procedure?"] = (x: any) => typeof x == "function";
  env.table["symbol?"] = (x: any) => typeof x == "string" && !x.startsWith("");
  env.table["string?"] = (x: any) => typeof x == "string" && x.startsWith("");
  env.table["list?"] = (l: any) => Array.isArray(l);
  // boolean functions
  env.table["and"] = (...list: any) => list.reduce((x: boolean, y: boolean) => x && y, true);
  env.table["or"] = (...list: any) => list.reduce((x: boolean, y: boolean) => x || y, false);
  env.table["not"] = (x: boolean) => !x;
  env.table["equal?"] = (x: any, y: any) => x ===y;
  // misc
  env.table["print"] = console.log
  env.table["begin"] = (...l: any) => l[l.length - 1];
  env.table["apply"] = (proc: any, args: []) => proc(...args);

  return env;
}

export const globalEnv = standardEnv();

export function typeOf(expression: Expression): string {
  if (typeof expression == "function") return "procedure";
  else if (typeof expression == "number") return "number";
  else if (typeof expression == "string" && !expression.startsWith('"')) return "symbol";
  // string literal, note that strings can't contain empty spaces given limitation with parser
  else if (typeof expression == "string" && expression.startsWith('"')) return "string";
  else if (Array.isArray(expression)) return "list";
  else throw TypeError("Unkown type");
}

/**
 * Evaluates an expression in an environment.
 */
export function evaluate(exp: any, env = globalEnv, verbose = false): Expression {
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

export function apply(operator: Expression, args: Array<Expression>, env: Environment, verbose=false) {
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
      const [defined, definition] = args;
      if (Array.isArray(defined)) return createProc(defined.slice(1), definition, env); // procedure definition
      else return env.table[defined as string] = evaluate(definition, env); // variable definition
    }
    case "set!": {
      const [symbol, definition] = args;
      searchEnv(symbol as string, env).table[symbol as string] = evaluate(definition, env);
      return null;
    }
    case "lambda": {
      const [parms, body] = args;
      return createProc(parms as Expression[], body, env);
    }
    default: { // procedure call
      const proc = evaluate(operator, env);
      const vals = args.map((arg) => evaluate(arg, env));
      //@ts-ignore proc is either a javascript function or a scheme procedure
      return proc(...vals);
    }
  }
}

export default function schemeEval(program: string, verbose = false) {
  return evaluate(parseTokens(tokenize(program)), globalEnv, verbose);
}

const fact10 = `
(begin
  (define (fact n) (if (<= n 1) 1 (* n (fact (- n 1))))))
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

console.log(schemeEval(fact10))
console.log(schemeEval(fibs10))
console.log(schemeEval(sqrt2))
console.log(schemeEval(symbdiff))
console.log(schemeEval(towers3))