n=int(input("Enter a number:"))

if n==1:
    print("It is neither prime nor composite")
else:
    for i in range(2,n):
        if n % i==0:
            print("It is not a prime")
            break
    else:
        print("It is a prime number")