include("./scheme.jl")

p0 = """
(begin
  (define a (list 1 2 3))
  (define b (list "a" "b" "c"))
  (cons a b))"""
@show evaluate(p0)

p1 = "(begin (define r 10) (* 3.14 (* r r)))"
@show evaluate(p1)

p2 = ("(car (list 1 2 3 4))")
@show evaluate(p2)

p3 = ("(cdr (list 1 2 3 4))")
@show evaluate(p3)

p4 = """
(begin 
  (define twice (lambda (x) (* 2 x)))
  (twice 10)
)
"""
@show evaluate(p4)

p5 = """
(begin
  (define fib (lambda (n) (if (< n 2) 1 (+ (fib (- n 1)) (fib (- n 2))))))
  (fib 10)
)
"""
@show evaluate(p5)

p6 = """(print "Hello")"""
@show evaluate(p6)

fact10 = """
(begin 
  (define fact (lambda (n) (if (<= n 1) 1 (* n (fact (- n 1))))))
  (fact 10)
)
"""
@show evaluate(fact10)

towersofhanoi3 = """
(begin
  (define move (lambda (n from to spare)
    (if 
      (= 0 n) "Done_Moving"
      (begin
        (move (- n 1) from spare to)
        (println "Move_" n "_from_" from "_to_" to)
        (move (- n 1) spare to from)
      )
    ))
)
  (move 3 "A" "B" "C")
)
"""
@show evaluate(towersofhanoi3)

jazr2 ="""
(begin
  (define threshold 1e-6)
  (define dx 1e-3)

  (define newton (lambda (f guess)
    (fixed-point (lambda (x) (- x (/ (f x) ((derive f threshold) x)))) guess)))

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
)
"""
@show evaluate(jazr2)

deriv_x_square_plus_2x = """
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

  (deriv (quote (+ (* x x) (* 2 x))) (quote x))
)
"""
@show evaluate(deriv_x_square_plus_2x)
