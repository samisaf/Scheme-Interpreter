"Takes a string representing a scheme program, and splits it into tokens"
tokenize(text::String) = split(replace(text, "(" => " ( ", ")" => " ) "))

"Takes a vector of tokens, and parses it "
function parseTokens(tokens::Vector)
  if length(tokens) == 0 throw(error("Syntax Error - Unexpected EOF")) end
  token = popfirst!(tokens)
  if token == "("
      L = []
      while tokens[1] != ")" push!(L, parseTokens(tokens)) end
      popfirst!(tokens) # pop off ')'
      return L
  elseif token == ")" throw(error("Syntax Error - Unexpected )"))
  else return atom(token)
  end
end

"Numbers become numbers; Strings become strings; every other token is a symbol."
function atom(token)
    try return parse(BigInt, token)
    catch err
        try return parse(Float64, token)
        catch err
          if token[1] =='"' return String(token) else return Symbol(token) end
        end
    end
end

"An environment: a dict of {'var':val} pairs, with an outer Env"
createEnv(table = Dict(), outer = Missing) = (table = table, outer = outer)

"Updates an environment table with a new dictionary"
updateEnv!(env, data) = merge!(env.table, data)

"Find the innermost Env where var appears."
function searchEnv(var, env)
  if var in keys(env.table) return env
  else return searchEnv(var, env.outer)
  end
end

"""A user-defined Scheme procedure."""
function createProc(parms, body, env)
  function callProc(args...)
    newenv = createEnv(Dict(zip(parms, args)), env)
    return schemeEval(body, newenv)
  end
  return callProc
end

"An environment with some Scheme standard procedures."
function standardEnv()
  env = createEnv()
  baseFunctions = Dict(
      :+         =>  +, 
      :-         =>  -, 
      :*         =>  *, 
      :/         =>  /, 
      :>         =>  >, 
      :<         =>  <, 
      :>=        =>  >=, 
      :<=        =>  <=, 
      :(=)       =>  ==, 
      :abs       =>  abs,
      :round     =>  round,
      :append    =>  push!,  
      :apply     =>  (proc, args) -> proc(args...),
      :begin     =>  (x...)  -> x[end],
      :car       =>  (x)     -> x[1],
      :cdr       =>  (x)     -> x[2:end], 
      :cons      =>  (x,y)   -> [x,y...],
      :expt      =>  ^,
      :length    =>  length, 
      :list      =>  (x...)  -> collect(x), 
      :map       =>  map,
      :filter    =>  filter,
      :reudce    =>  reduce,
      :max       =>  max,
      :min       =>  min,
      :not       =>  !,
      :and       =>  (x, y)  -> x&&y,
      :or        =>  (x, y)  -> x||y,
      :print     =>  print,
      :println   =>  println,
      Symbol("equal?")    =>  ==, 
      Symbol("list?")     =>  (x) -> typeof(x) <: Vector, 
      Symbol("procedure?")=> (x) -> typeof(x) <: Function,
      Symbol("null?")     =>  (x) -> length(x) == 0, 
      Symbol("number?")   =>  (x) -> typeof(x) <: Int || typeof(x) <: Float,  
      Symbol("symbol?")   => x -> typeof(expression) <: Symbol
  )
  updateEnv!(env, baseFunctions)
  return env
end

"Evaluates a scheme expression in an environment."
function schemeEval(expression, env)
  # string literal, note that strings can't contain empty spaces given limitation with parser
  if typeof(expression) <: String return expression[2:end-1]
  # variable reference
  elseif typeof(expression) <: Symbol return searchEnv(expression, env).table[expression]
  # constant number   
  elseif typeof(expression) <: Number return expression
  # list expression
  elseif typeof(expression) <: Vector
    operator, args... = expression
    return schemeApply(operator, args, env)
  else
    throw(error("Syntax Error - Unexpected Expression"))
  end
end

function schemeApply(operator, args, env)
  # quotation
  if operator == :quote
    return args[1]
  # conditional
  elseif operator == :if
    (test, conseq, alt) = args
    exp = schemeEval(test, env) ? conseq : alt
    return schemeEval(exp, env)
  # definition
  elseif operator == :define
    (symbol, definition) = args
    env.table[symbol] = schemeEval(definition, env)
  # set
  elseif operator == :set!
    (symbol, definition) = args
    searchEnv(symbol, env).table[symbol] = schemeEval(definition, env)
  # procedure
  elseif operator == :lambda  
    (parms, body) = args
    return createProc(parms, body, env)
  # procedure call
  else
    proc = schemeEval(operator, env)
    vals = [schemeEval(arg, env) for arg in args]
    return proc(vals...)
  end
end

evaluate(program) = schemeEval(parseTokens(tokenize(program)), standardEnv())