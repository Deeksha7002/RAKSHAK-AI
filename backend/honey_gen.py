import random
import string
import time

def generate_luhn_credit_card(bin_prefix="4"):
    """
    Generates a Luhn-valid credit card number.
    By default starts with '4' (Visa).
    """
    # 13 digits of random data + 1 for bin + 1 for check
    length = 16
    number = [int(bin_prefix)]
    while len(number) < length - 1:
        number.append(random.randint(0, 9))
    
    # Calculate check digit
    digits = number[:]
    for i in range(len(digits) - 1, -1, -2):
        digits[i] *= 2
        if digits[i] > 9:
            digits[i] -= 9
    
    check_digit = (10 - (sum(digits) % 10)) % 10
    number.append(check_digit)
    
    return "".join(map(str, number))

def generate_honey_otp():
    """Generates a 6-digit OTP."""
    return "".join(random.choices(string.digits, k=6))

def generate_fake_id(type="SSN"):
    """Generates a fake ID in common formats."""
    if type == "SSN":
        return f"{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(1000, 9999)}"
    elif type == "ADHAAR":
        return " ".join(["".join(random.choices(string.digits, k=4)) for _ in range(3)])
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=10))

def generate_honey_payload():
    """
    Returns a unified 'Honey Trap' bundle for the agent to use.
    """
    return {
        "credit_card": generate_luhn_credit_card(),
        "cvv": str(random.randint(100, 999)),
        "expiry": f"{random.randint(1, 12):02d}/{random.randint(25, 30)}",
        "otp": generate_honey_otp(),
        "ssn": generate_fake_id("SSN"),
        "adhaar": generate_fake_id("ADHAAR")
    }

if __name__ == "__main__":
    print(f"Visa: {generate_luhn_credit_card('4')}")
    print(f"MasterCard: {generate_luhn_credit_card('5')}")
    print(f"OTP: {generate_honey_otp()}")
    print(f"Unified: {generate_honey_payload()}")
