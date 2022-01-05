import math
import operator
from collections import namedtuple
import sys

### Type Definitions
Symbol = str              # A Scheme Symbol is implemented as a Python str
Number = (int, float)     # A Scheme Number is implemented as a Python int or float
Atom   = (Symbol, Number) # A Scheme Atom is a Symbol or Number
List   = list             # A Scheme List is implemented as a Python list
Exp    = (Atom, List)     # A Scheme expression is an Atom or List
# A Scheme environment is a mapping of {variable: value}, an environment may refer to a parent environment
Env    = namedtuple('Env', ['table', 'outer']) 
# A Scheme procedure has parameter, and body, and it is defined in an environment
Proc = namedtuple('Proc', ['parms', 'body', 'env'])

### Parsing
def tokenize(chars: str) -> list:
  """Converts a string of characters into a list of tokens."""
  return chars.replace('(', ' ( ').replace(')', ' ) ').split()

def parse(program: str) -> Exp:
  """Reads Scheme program from a string"""
  return parse_tokens(tokenize(program))

def parse_tokens(tokens: list) -> Exp:
  """Reads an expression from a sequence of tokens."""
  if len(tokens) == 0: raise SyntaxError('unexpected EOF')
  token = tokens.pop(0)
  if token == '(':
      L = []
      while tokens[0] != ')': L.append(parse_tokens(tokens))
      tokens.pop(0) # pop off ')'
      return L
  elif token == ')': raise SyntaxError('unexpected )')
  else: return atom(token)

def atom(token: str) -> Atom:
    """Numbers become numbers; every other token is a symbol."""
    try: return int(token)
    except ValueError:
        try: return float(token)
        except ValueError:
            return Symbol(token) # token is symbol

### Creating an environment object
def createEnv(table = {}, outer = None) -> Env:
  """An environment: a dict of {'var':val} pairs, with an outer Env"""
  return Env(table, outer)

def searchEnv(var, env) -> Env:
  """Find the innermost Env where var appears."""
  if var in env.table: return env
  elif env.outer == None: return None
  else: return searchEnv(var, env.outer)

### Creating a procedure object
def createProc(parms, body, env) -> Proc: 
    """A user-defined Scheme procedure."""
    return Proc(parms, body, env)

def callProc(proc: Proc, *args) -> Exp:
  """Calls a procedure with given arguments"""
  newenv = createEnv(dict(zip(proc.parms, args)), proc.env)
  return eval(proc.body, newenv)

### Building a basic Scheme environment
def standardEnv() -> Env:
  """An environment with some Scheme standard procedures."""
  env = createEnv()
  funcs1 = vars(math) # sin, cos, sqrt, pi, ...
  funcs2 = {
      '+':       operator.add, 
      '-':       operator.sub, 
      '*':       operator.mul, 
      '/':       operator.truediv, 
      '>':       operator.gt, 
      '<':       operator.lt, 
      '>=':      operator.ge, 
      '<=':      operator.le, 
      '=':       operator.eq, 
      'abs':     abs,
      'append':  operator.add,  
      'apply':   lambda proc, args: proc(*args),
      'begin':   lambda *x: x[-1],
      'car':     lambda x: x[0],
      'cdr':     lambda x: x[1:], 
      'cons':    lambda x,y: [x] + y,
      'eq?':     operator.is_, 
      'expt':    pow,
      'equal?':  operator.eq, 
      'length':  len, 
      'list':    lambda *x: List(x), 
      'list?':   lambda x: isinstance(x, List), 
      'map':     map,
      'max':     max,
      'min':     min,
      'not':     operator.not_,
      'and':     operator.and_,
      'or':     operator.or_,
      'null?':   lambda x: x == [], 
      'number?': lambda x: isinstance(x, Number),  
      'print':   print,
      'procedure?': lambda p: callable(p) or isinstance(p, Proc),
      'round':   round,
      'symbol?': lambda x: isinstance(x, Symbol),
  }
  env.table.update(funcs1)
  env.table.update(funcs2)
  return env

### Evaluation
def eval(exp, env=standardEnv()) -> Exp:
  """Evaluates an expression in an environment."""
  # string literal
  if isinstance(exp, Symbol) and exp.startswith('"'): return exp
  # variable reference
  elif isinstance(exp, Symbol): return searchEnv(exp, env).table[exp]
  # constant number   
  elif isinstance(exp, Number): return exp
  # list expression
  elif isinstance(exp, List):
    operator, *args = exp
    # quotation
    if operator == 'quote': return args[0]
    # conditional
    elif operator == 'if':
        (test, conseq, alt) = args
        exp = (conseq if eval(test, env) else alt)
        return eval(exp, env)
    # definition
    elif operator == 'define':
        (symbol, definition) = args
        env.table[symbol] = eval(definition, env)
    # set
    elif operator == 'set!':
        (symbol, definition) = args
        searchEnv(symbol, env).table[symbol] = eval(definition, env)
    # procedure
    elif operator == 'lambda':         
        (parms, body) = args
        return createProc(parms, body, env)
    # procedure call
    else:
        proc = eval(operator, env)
        vals = [eval(arg, env) for arg in args]
        if isinstance(proc, Proc): return callProc(proc, *vals)
        else: return proc(*vals)
  else:
    raise SyntaxError('unexpected expression')

def evaluate(text):
    return eval(parse(text))

### Creatine a real eval print loop
def repl(prompt='lis.py> '):
    "A prompt-read-eval-print loop."
    while True:
        val = eval(parse(input(prompt)))
        if val is not None: 
            print(schemestr(val))

def schemestr(exp):
    "Convert a Python object back into a Scheme-readable string."
    if isinstance(exp, List):
        return '(' + ' '.join(map(schemestr, exp)) + ')' 
    else:
        return str(exp)

### Run program
if __name__=="__main__": 
  if len(sys.argv) == 1: repl()
  else:
    file = open(sys.argv[1])
    lines = file.readlines()
    program = ''.join(lines)
    file.close()
    evaluate(program)