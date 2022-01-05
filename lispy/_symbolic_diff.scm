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

  (print diff)
)