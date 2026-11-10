import unittest

from booking import can_book

BASE = [(600, 660)]


class TestCanBook(unittest.TestCase):
    def test_ac1_starts_now_rejected(self):
        self.assertFalse(can_book(540, 570, 540, False, BASE))

    def test_ac1_reversed_times_rejected(self):
        self.assertFalse(can_book(720, 660, 540, False, BASE))

    def test_ac1_valid_day_bound_1440(self):
        self.assertTrue(can_book(1320, 1440, 540, False, BASE))

    def test_ac1_exceeds_1440_rejected(self):
        self.assertFalse(can_book(1350, 1441, 540, False, BASE))

    def test_ac2_exactly_120_allowed(self):
        self.assertTrue(can_book(720, 840, 540, False, BASE))

    def test_ac2_121_rejected(self):
        self.assertFalse(can_book(720, 841, 540, False, BASE))

    def test_ac3_blocked_rejected(self):
        self.assertFalse(can_book(660, 720, 540, True, BASE))

    def test_ac4_touching_allowed(self):
        self.assertTrue(can_book(660, 720, 540, False, BASE))

    def test_ac4_overlap_rejected(self):
        self.assertFalse(can_book(630, 690, 540, False, BASE))

    def test_ac5_existing_not_mutated(self):
        existing = [(600, 660), (780, 840)]
        snapshot = list(existing)
        self.assertTrue(can_book(660, 720, 540, False, existing))
        self.assertEqual(existing, snapshot)

    # Regression for R2: now must be a whole minute in 0..1439
    def test_r2_now_out_of_range_rejected(self):
        self.assertFalse(can_book(0, 60, -30, False, []))
        self.assertFalse(can_book(660, 720, 1440, False, []))

    def test_r2_now_boundaries_valid(self):
        self.assertTrue(can_book(60, 120, 0, False, []))
        self.assertTrue(can_book(1439, 1440, 1438, False, []))


if __name__ == "__main__":
    unittest.main(verbosity=2)
