(begin
  (define move (lambda (n from to spare)
    (if 
      (= 0 n) "Done_Moving"
      (begin
        (move (- n 1) from spare to)
        (print (list "Move" n "from" from "to" to))
        (move (- n 1) spare to from)
      )
    ))
)
  (move 3 "One" "Three" "Two")
)