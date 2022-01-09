import { assert, assertStrictEquals, assertArrayIncludes, assertEquals } from "https://deno.land/std/testing/asserts.ts";
import {globalEnv, tokenize, parseTokens, createEnv, searchEnv} from "./main.ts";

// Testing tokenize function
const p0 = "(define pi 3.14)"
const p0Tokens = ["(", "define", "pi", "3.14", ")"];
const p0Parsed = ["define", "pi", 3.14]

const p1 = `(begin  
                (define name "Nice_Man")
                (define r 10) 
            )`
const p1Tokens = ["(", "begin", "(", "define", "name",  '"Nice_Man"', ")", 
                                "(", "define", "r", "10", ")", ")"];

const e1 = createEnv({"brand": "Ford", "color":"red", "model": "Mustang", "year": 1964});
e1.table["tires"] = "all season";
e1.table["year"] =  1970;
const e2 = createEnv({"color": "blue"}, e1);

Deno.test("Testing Parsing Functions", () => {
    assert(tokenize(p0).map( (t, i) => t === p0Tokens[i]).reduce( (x, y) => x&&y, true))
    assert(tokenize(p1).map( (t, i) => t === p1Tokens[i]).reduce( (x, y) => x&&y, true))

    assert(parseTokens(tokenize(p0))[2] === 3.14)
    assert(parseTokens(tokenize(p1))[2][2] === 10)

    assertArrayIncludes(parseTokens(tokenize(p0)), p0Parsed)
    assertArrayIncludes(p0Parsed, parseTokens(tokenize(p0)))

    assert(! tokenize(p0).map( (t, i) => t === p1Tokens[i]).reduce( (x, y) => x&&y, true))
    assert(! tokenize(p1).map( (t, i) => t === p0Tokens[i]).reduce( (x, y) => x&&y, true))
})
Deno.test("Testing Environment Functions", () => {
assert(searchEnv("color", e1) === "red");
assert(searchEnv("color", e2) === "blue");
assert(searchEnv("brand", e2) === "Ford");


})

Deno.test("Testing Standard Environment Functions", () => {


    assert(globalEnv.table['abs'](-5) === 5)
    assert(globalEnv.table.PI - 3.14 < 0.01)

    assertStrictEquals(globalEnv.table['+'](4, 3), 7)
    assertStrictEquals(globalEnv.table['-'](4, 3), 1)
    assertStrictEquals(globalEnv.table['*'](4, 3), 12)
    assertStrictEquals(globalEnv.table['/'](4, 3), 4/3)

    assertStrictEquals(globalEnv.table['+'](4, 3, -1), 6)
    assertStrictEquals(globalEnv.table['*'](4, 3, -1), -12)

    const l = ['a', 'b', 'c']
    assertStrictEquals(globalEnv.table.car(l), 'a')
    assertArrayIncludes(globalEnv.table.cdr(l), ['b', 'c'])
    assertArrayIncludes(globalEnv.table.cons(1, 2), [1, 2])
    assertArrayIncludes(globalEnv.table.cons(l, 2), [['a', 'b', 'c'], 2])
    assertArrayIncludes(globalEnv.table.append(l, 'd'), ['a', 'b', 'c', 'd'])


})