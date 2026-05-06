"""
Business logic calculations - GST, rates, stock
Preserves exact logic from the original Tkinter app
"""


def calculate_wholesale_rate(purchase_rate: float, margin1: float) -> float:
    """Calculate wholesale rate from purchase rate and margin1 percentage"""
    return round(purchase_rate * (1 + margin1 / 100), 2)


def calculate_retail_rate(wholesale_rate: float, margin2: float) -> float:
    """Calculate retail rate from wholesale rate and margin2 percentage"""
    return round(wholesale_rate * (1 + margin2 / 100), 2)


def calculate_closing_stock(opening: int, purchased: int, sold: int = 0) -> int:
    """Calculate closing stock: opening + purchased - sold"""
    return opening + purchased - sold


def calculate_gst(subtotal: float, include_gst: bool = False) -> dict:
    """
    Calculate GST breakdown
    GST rate: 18% (9% CGST + 9% SGST)
    """
    if include_gst:
        cgst = round(subtotal * 0.09, 2)
        sgst = round(subtotal * 0.09, 2)
        total = round(subtotal + cgst + sgst, 2)
    else:
        cgst = 0.0
        sgst = 0.0
        total = round(subtotal, 2)
    
    return {
        "subtotal": round(subtotal, 2),
        "cgst": cgst,
        "sgst": sgst,
        "total": total
    }


def calculate_bill_totals(items: list, include_gst: bool = False, amount_paid: float = 0) -> dict:
    """
    Calculate complete bill totals from items
    """
    subtotal = sum(item.get("amount", item.get("qty", 0) * item.get("rate", 0)) for item in items)
    gst_result = calculate_gst(subtotal, include_gst)
    
    remaining = max(0, gst_result["total"] - amount_paid)
    
    return {
        **gst_result,
        "amount_paid": round(amount_paid, 2),
        "remaining_amount": round(remaining, 2)
    }


def calculate_rates(purchase_rate: float, margin1: float, margin2: float,
                     manual_wholesale: float = None, manual_retail: float = None) -> dict:
    """
    Calculate wholesale and retail rates, supporting both margin-based and manual entry.
    When margin is 0, use manual rate; otherwise calculate from margin.
    """
    if margin1 == 0 and manual_wholesale is not None and manual_wholesale > 0:
        wholesale_rate = round(manual_wholesale, 2)
    else:
        wholesale_rate = calculate_wholesale_rate(purchase_rate, margin1)
    
    if margin2 == 0 and manual_retail is not None and manual_retail > 0:
        retail_rate = round(manual_retail, 2)
    else:
        retail_rate = calculate_retail_rate(wholesale_rate, margin2)
    
    return {
        "purchase_rate": round(purchase_rate, 2),
        "margin1": round(margin1, 2),
        "wholesale_rate": wholesale_rate,
        "margin2": round(margin2, 2),
        "retail_rate": retail_rate
    }


def validate_phone_number(phone: str) -> str | None:
    """
    Validate and format Indian phone number
    Returns cleaned 10-digit number or None if invalid
    """
    if not phone:
        return None
    
    clean_phone = ''.join(filter(str.isdigit, phone))
    
    if len(clean_phone) == 10:
        return clean_phone
    elif len(clean_phone) == 11 and clean_phone.startswith('0'):
        return clean_phone[1:]
    elif len(clean_phone) == 12 and clean_phone.startswith('91'):
        return clean_phone[2:]
    
    return None
