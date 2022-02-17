# Word Lapse Data Management

This project includes a large data dependency,
[word-lapse-models](https://github.com/greenelab/word-lapse-models), which is
included as a [submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
under `./server/data`. If you don't want the data dependency (which comes in at
~20GB on its own, and twice that for the LFS objects cached in the git folder),
simply clone this repo as usual. You can safely ignore the rest of the
instructions concerning submodules below.

### Submodule Cloning

If you *do* want the data dependency when you clone, you can use the following
command:

```
git clone --recurse-submodules git@github.com:greenelab/word-lapse.git
```

If at first you don't clone the submodule but you want it later, you can use the
following command to populate it, or to pull the latest version that's been
pinned in this repo:

```
git submodule update
```

This will clone `word-lapse-models` into `./server/data`, at the commit that
was specified when the submodule was added to this repo.

### Submodule History Syncing

As mentioned above, the repo will be checked out in a "detached head" state at
the commit that HEAD pointed to when the submodule was added to the parent repo.
This feature allows the submodule's commit history to advance independently of
the parent repo: the parent will always (by default) have a known version of the
submodule when the submodule is updated.

If you want to catch up to the latest commit in the submodule, simply enter
`./server/data` and check out, for example, `main`. Your submodule will no
longer be in a detached head state, but instead at the branch you checked out.
Generally, you can operate on the submodule as if it were a standalone git repo,
e.g. you can fetch, pull, push, etc.

Once you've made some commits in the submodule, you might want to sync the
parent repo to a specific commit. Simply set the submodule to that state (e.g.,
by checking out that commit, or checking out a branch), then cd out of the
submodule folder and commit `./server/data`. The submodule will be pinned to
that commit, so e.g. if someone were to clone the parent repo recursively or
update the submodule, that commit would be checked out.
