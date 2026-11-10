"""Reference implementation of the Room 304 availability contract (AC1-AC5).

can_book(start, end, now, blocked, existing) -> bool
Standard library only. `existing` is read, never mutated.
"""
from typing import Sequence, Tuple

DAY_MINUTES = 1440
MAX_DURATION = 120


def can_book(start: int, end: int, now: int, blocked: bool,
             existing: Sequence[Tuple[int, int]]) -> bool:
    # Type guard: bool is a subclass of int in Python (ISS-03)
    for value in (start, end, now):
        if not isinstance(value, int) or isinstance(value, bool):
            return False
    # AC1: now must be a whole minute in 0..1439 (R2)
    if now < 0 or now >= DAY_MINUTES:
        return False
    # AC3: a blocked room rejects every request
    if blocked:
        return False
    # AC1: day bounds and interval order
    if start < 0 or end > DAY_MINUTES or start >= end:
        return False
    # AC1: start must be strictly after now
    if start <= now:
        return False
    # AC2: maximum duration (120 allowed, 121 rejected)
    if (end - start) > MAX_DURATION:
        return False
    # AC4: half-open overlap; touching endpoints are allowed
    for b_start, b_end in existing:
        if start < b_end and end > b_start:
            return False
    return True
