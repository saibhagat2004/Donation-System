#!/usr/bin/env python3
"""
Test script to verify transaction direction logic for donations
"""

def test_transaction_direction(transaction_type):
    """Test the transaction direction logic"""
    return 'credit' if 'Deposit' in transaction_type or 'From' in transaction_type or 'Received' in transaction_type else 'debit'

# Test different transaction types
test_cases = [
    "Amount Deposit",
    "Amount Withdraw", 
    "Fund Transfer From 12345678",
    "Fund Transfer -> 87654321",
    "Donation Received"
]

print("🧪 Testing Transaction Direction Logic:")
print("=" * 50)

for transaction_type in test_cases:
    direction = test_transaction_direction(transaction_type)
    symbol = "+" if direction == "credit" else "-"
    print(f"{transaction_type:25} → {direction:6} ({symbol})")

print("\n✅ 'Donation Received' should show as 'credit' (+)")