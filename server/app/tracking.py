import linecache
import os
import tracemalloc

from contextlib import contextmanager
from timeit import default_timer

def display_top(snapshot, key_type='lineno', limit=3):
    snapshot = snapshot.filter_traces((
        tracemalloc.Filter(False, "<frozen importlib._bootstrap>"),
        tracemalloc.Filter(False, "<unknown>"),
    ))
    top_stats = snapshot.statistics(key_type)

    print("Top %s lines" % limit)
    for index, stat in enumerate(top_stats[:limit], 1):
        frame = stat.traceback[0]
        # replace "/path/to/module/file.py" with "module/file.py"
        filename = os.sep.join(frame.filename.split(os.sep)[-2:])
        print("#%s: %s:%s: %.1f KiB"
              % (index, filename, frame.lineno, stat.size / 1024))
        line = linecache.getline(frame.filename, frame.lineno).strip()
        if line:
            print('    %s' % line)

    other = top_stats[limit:]
    if other:
        size = sum(stat.size for stat in other)
        print("%s other: %.1f KiB" % (len(other), size / 1024))
    total = sum(stat.size for stat in top_stats)
    print("Total allocated size: %.1f KiB" % (total / 1024))


@contextmanager
def track_usage(limit=3):
    tracemalloc.start()
    yield
    snapshot = tracemalloc.take_snapshot()
    display_top(snapshot, limit=limit)

@contextmanager
def timed(verbose=False):
    start = default_timer()
    yield
    end = default_timer()
    
    
class ExecTimer(object):
    def __init__(self, verbose=False):
        self.verbose = verbose
        self.timer = default_timer
        
    def __enter__(self):
        self.start = self.timer()
        return self

    def snapshot(self):
        end = self.timer()
        self.elapsed_secs = end - self.start
        self.elapsed = self.elapsed_secs * 1000  # millisecs
        return self.elapsed
        
    def __exit__(self, *args):
        self.snapshot()
        if self.verbose:
            print('elapsed time: %f secs' % self.elapsed_secs, flush=True)
