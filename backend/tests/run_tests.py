import unittest
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def run_all_tests():
    print("=" * 60)
    print("RUNNING AI IT SUPPORT RESOLUTION AGENT TEST SUITE")
    print("=" * 60)
    
    loader = unittest.TestLoader()
    start_dir = os.path.dirname(__file__)
    suite = loader.discover(start_dir, pattern="test_*.py")

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 60)
    if result.wasSuccessful():
        print(f"ALL {result.testsRun} TESTS PASSED SUCCESSFULLY!")
        print("=" * 60)
        return 0
    else:
        print(f"TEST FAILURES: {len(result.failures)}, ERRORS: {len(result.errors)}")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(run_all_tests())
