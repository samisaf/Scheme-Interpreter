import lis
import sys

filenames = ['_towershanoi3.scm', '_factorial100.scm', '_sqrt2.scm', '_fib10.scm']

if __name__=="__main__": 
    for filename in filenames:
        file = open(filename)
        lines = file.readlines()
        program = ''.join(lines)
        file.close()
        print(filename)
        print(lis.evaluate(program))