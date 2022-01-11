// © 2022 Sami Safadi

/** Converts a string of characters into a list of tokens.*/
function tokenize(text) {
  const isEmpty = (s) => s === "" || s === "\n" || s === "\t" || s === "\r\n";
  return text.replaceAll("(", " ( ").replaceAll(")", " ) ").replaceAll(/[\s\n\t]/g, " " ).split(" ").filter((s) => !isEmpty(s));
}

/** Converts a sequence of string tokens into an array representing the AST.*/
function parseTokens(tokens) {
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
    // A string can represent a symbol or a string. See typeOf function.
    else return isNaN(Number(token)) ? String(token) : Number(token);
  }
}

/** Creates an environment which is a mapping of {'name':val} pairs, with a reference to an outer Env*/
function createEnv(table = {}, outer = {}) {
  return { table, outer };
}

/** Finds the innermost environment where name appears */
export function searchEnv(name, env) {
  const value = env.table[name];
  return typeof value === "undefined" ? searchEnv(name, env.outer) : env;
}

/** Creates a user-defined a procedure object. */
function createProc(parms, body, env) {
  function call(...args) {
    const newEnv = createEnv(zip(parms, args), env);
    return evaluate(body, newEnv);
  }
  return call;
}

/** Zips two arrays of keys and values to an object.*/
function zip(a1, a2) {
  return a1.reduce((acc, k, i) => (acc[k] = a2[i], acc), {});
}

/** Creates a standar environment with basic standard procedures.*/
function standardEnv() {
  const env = createEnv(Math); // sin, cos, sqrt, pi, ...
  // Arithemitc operators
  env.table["+"] = (...array) => array.reduce((x, y) => x + y, 0);
  env.table["*"] = (...array) => array.reduce((x, y) => x * y, 1);
  env.table["-"] = (x, y) => x - y;
  env.table["/"] = (x, y) => x / y;
  env.table[">"] = (x, y) => x > y;
  env.table[">="] = (x, y) => x >= y;
  env.table["<"] = (x, y) => x < y;
  env.table["<="] = (x, y) => x <= y;
  env.table["="] = (x, y) => x === y;
  // list operators 1
  env.table["list"] = (...args) => Array(args).pop();
  env.table["car"] = (l) => l[0];
  env.table["cdr"] = (l) => l.slice(1);
  env.table["cons"] = (x, y) => [x, y];
  env.table["append"] = (l, i) => [...l, i];
  // list operators 2
  env.table["map"] = (func, list) => list.map(func);
  env.table["filter"] = (func, list) => list.filter(func);
  env.table["reduce"] = (func, list, initial) => list.reduce(func, initial);
  // type checks
  env.table["null?"] = (x) => x.length == 0;
  env.table["number?"] = (x) => typeof x == "number";
  env.table["procedure?"] = (x) => typeof x == "function";
  env.table["symbol?"] = (x) => typeof x == "string" && !x.startsWith("");
  env.table["string?"] = (x) => typeof x == "string" && x.startsWith("");
  env.table["list?"] = (l) => Array.isArray(l);
  // boolean functions
  env.table["and"] = (...list) => list.reduce((x, y) => x && y, true);
  env.table["or"] = (...list) => list.reduce((x, y) => x || y, false);
  env.table["not"] = (x) => !x;
  env.table["equal?"] = (x, y) => x ===y;
  // misc
  env.table["print"] = console.log
  env.table["begin"] = (...l) => l[l.length - 1];
  env.table["apply"] = (proc, args) => proc(...args);
  return env;
}

const globalEnv = standardEnv();

function typeOf(expression) {
  if (typeof expression == "function") return "procedure";
  else if (typeof expression == "number") return "number";
  else if (typeof expression == "string" && !expression.startsWith('"')) return "symbol";
  // string literal, note that strings can't contain empty spaces given limitation with parser
  else if (typeof expression == "string" && expression.startsWith('"'))  return "string";
  else if (Array.isArray(expression)) return "list";
  else throw TypeError("Unkown type");
}

/** Evaluates an expression in an environment.*/
function evaluate(exp, env = globalEnv, verbose = false) {
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

/** Applies an operator to arguments in an environment.*/
function apply(operator, args, env, verbose = false) {
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
      env.table[symbol] = evaluate(definition, env);
      return null;
    }
    case "set!": {
      const [symbol, definition] = args;
      searchEnv(symbol, env).table[symbol] = evaluate(definition, env);
      return null;
    }
    case "lambda": {
      const [parms, body] = args;
      return createProc(parms, body, env);
    }
    default: {
      // procedure call
      const proc = evaluate(operator, env);
      const vals = args.map((arg) => evaluate(arg, env));
      return proc(...vals);
    }
  }
}

export default function schemeEval(program, verbose = false) {
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

console.log(schemeEval('(cos PI)'))
console.log(schemeEval(fact10))
console.log(schemeEval(fibs10))
console.log(schemeEval(sqrt2))
console.log(schemeEval(towers3))
console.log(schemeEval(symbdiff))
