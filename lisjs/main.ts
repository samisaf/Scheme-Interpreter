type SchemeNumber = number; // Scheme number will be implemented as javascript number
type SchemeString = string; // Scheme string will be implemented as javascript string
type SchemeSymbol = string; // a symbol is a string
type Atom = SchemeNumber | SchemeString | SchemeSymbol;
type Expression = Atom | Array<Expression>;

type R = Map<string, number | string>
type Env = {table: any; outer: Env;};

/**
 * Converts a string of characters into a list of tokens.
 */
 function tokenize(text: string): string[] {
    return text.replaceAll("(", " ( ").replaceAll(")", " ) ").split(" ").filter(s => !isEmpty(s));
  }

function isEmpty(s: string){
    return s === "" || s ==="\n" || s === "\t" || s === "\r\n";
  }

/**
 * Reads an expression from a sequence of tokens.
 */
function parseTokens(tokens: string[]): Expression {
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
function createEnv(table={}, outer={}): Env{
  //@ts-ignore: outer can be empty in the global environment
  return {table, outer};
}


function searchEnv(name: string, env: Env): Env{
  const value = env.table[name];
  return value? value : searchEnv(name, env.outer);

}




let p1 = `
(begin  
  (define name "Nice_Man")
  (define r 10) 
  (* pi (* r r))
)`

console.log(tokenize(p1))
console.log(parseTokens(tokenize(p1)))

let e1 = createEnv({"brand": "Ford", "model": "Mustang", "year": 1964})
e1.table["tires"] = "all season"
e1.table["year"] =  1970
let e2 = createEnv({"color": "blue"}, e1)
console.log(searchEnv("color", e2))
console.log(searchEnv("brand", e2))
console.log(e2)