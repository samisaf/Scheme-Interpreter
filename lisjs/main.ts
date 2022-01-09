type SchemeNumber = number; // Scheme number will be implemented as javascript number
type SchemeString = string; // Scheme string will be implemented as javascript string
type SchemeSymbol = string; // a symbol is a string
type Atom = SchemeNumber | SchemeString | SchemeSymbol;
type Expression = Atom | Array<Expression>;

type R = Map<string, number | string>
type SchemeEnv = {table: any; outer: SchemeEnv;};
type SchemeProc = {parms: []; body: any; env: SchemeEnv;};
/**
 * Converts a string of characters into a list of tokens.
 */
export function tokenize(text: string): string[] {
    return text.replaceAll("(", " ( ").replaceAll(")", " ) ").split(" ").filter(s => !isEmpty(s));
  }

function isEmpty(s: string){
    return s === "" || s ==="\n" || s === "\t" || s === "\r\n";
  }

/**
 * Reads an expression from a sequence of tokens.
 */
export function parseTokens(tokens: string[]): Expression {
  if (tokens.length === 0) throw SyntaxError("unexpected EOF");
  else{
    const token = tokens.shift(); // pops first token
    if (token === "(") {
      const L = [];
      while (tokens[0] !== ")") L.push(parseTokens(tokens));
      tokens.shift();
      return L;
    }
    else if (token === ")") throw SyntaxError('unexpected )')
    // @ts-ignore: token will always have a value as we checked for non-empty array
    else return atom(token)
  }
}

/**
 * Numbers become numbers; otherwise, token is either a symbol or a string.
 * Will have to differentiate between symbols and strings later
 */
function atom(token: string): Atom{
  const parsed = Number(token)
  return isNaN(parsed)? String(token): parsed
}
 
// Creating an environment object
/**
 * An environment: a mapping of {'name':val} pairs, with a reference to an outer Env
 */
export function createEnv(table={}, outer={}): SchemeEnv{
  //@ts-ignore: outer can be empty in the global environment
  return {table, outer};
}

/**
 * Finds the innermost Env where name appears
 */
export function searchEnv(name: string, env: SchemeEnv): SchemeEnv{
  const value = env.table[name];
  return value? value : searchEnv(name, env.outer);

}

// Creating a procedure object
/**
 * A user-defined Scheme procedure.
 */
function createProc(parms: [], body: {}, env: SchemeEnv) : SchemeProc{
  return {parms, body, env};
}

/**
 * Calls a procedure with given arguments
 */
function callProc(proc: SchemeProc, args: any): any{
  const zip =  {...proc.parms.map( (parm, index) => {parm: args[index]})}
  console.log(zip)
  const newEnv = createEnv(zip, proc.env);
  return null; //evaluate(proc.body, newEnv);
}

// Building a basic Scheme environment
/**
 * An environment with some Scheme standard procedures.
 */
function standardEnv(): SchemeEnv{
  const env = createEnv(Math) // sin, cos, sqrt, pi, ...
  //@ts-ignore: +
  env.table['+'] = (...array) => array.reduce((x, y) => x + y, 0);
  //@ts-ignore: *
  env.table['*'] = (...array) => array.reduce((x, y) => x * y, 1);
  env.table['-'] = (x: number, y: number) => x - y
  env.table['/'] = (x: number, y: number) => x / y
  env.table['>'] = (x: number, y: number) => x > y
  env.table['>='] = (x: number, y: number) => x >= y
  env.table['<'] = (x: number, y: number) => x < y
  env.table['<='] = (x: number, y: number) => x <= y
  env.table['='] = (x: number, y: number) => x === y

  env.table['apply'] = (proc: Function, args: []) => proc(...args)
  env.table['begin'] = (l: []) => l[l.length - 1]
 
  //@ts-ignore: car
  env.table['car'] = (l) => l[0]
  //@ts-ignore: cdr
  env.table['cdr'] = l => l.slice(1)
  env.table['cons'] = (x: any, y: any) => [x, y]  
  env.table['append'] = (l: any, i: any) => [...l, i]

  env.table['list'] = (args: any) => Array(args)
  env.table['list?'] = (l: any) => Array.isArray(l)

  return env;
}

export const globalEnv = standardEnv();