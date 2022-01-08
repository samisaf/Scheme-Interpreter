type Atom = string | number;
type Expression = Atom | Array<Atom> | Array<Expression>

/**
 * Converts a string of characters into a list of tokens.
 */
 function tokenize(text: string): string[] {
    return text.replaceAll("(", " ( ").replaceAll(")", " ) ").split(" ").filter(s => !isEmpty(s))
  }

function isEmpty(s: string){
    return s === "" || s ==="\n" || s === "\t" || s === "\r\n";
  }

/**
 * Reads an expression from a sequence of tokens.
 */
function parseTokens(tokens: string[]): Expression {
  if (tokens.length === 0) throw SyntaxError("unexpected EOF");
  const token = tokens.shift(); // pops first token
  if (token === "(") {
    const L = []
    while (tokens[0] !== ")") L.push(parseTokens(tokens))
    tokens.shift()
    return L
  }
  else if (token === ")") throw SyntaxError('unexpected )')
  else return atom(token || "")
}

/**
 * Numbers become numbers; every other token is a symbol.
 */
function atom(token: string): Atom{
  const parsed = Number(token)
  return isNaN(parsed)? String(token): parsed

}
 
let p1 = `
(begin  (define r 10) 
        (* pi (* r r))
)`

console.log(tokenize(p1))
console.log(parseTokens(tokenize(p1)))