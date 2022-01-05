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
)