# Rejected Phase 8 Visual Experiment

Archived before visual recovery work on 2026-07-30.

The repository had no committed Phase 7/8 boundary. To avoid committing or
rewriting unrelated user changes, the exact rejected state is preserved as:

- `tracked-working-tree.patch`
  - Binary-capable patch of every tracked working-tree change against
    `377fee5`.
  - SHA-256:
    `ab1c33ddd5021dfbd11b7b1ecbc5623fdaf6968a21f04f7f11d858a2d3851d8c`
- `phase8-untracked-source.tar.gz.part-00`
- `phase8-untracked-source.tar.gz.part-01`
  - GitHub-safe parts of the byte-exact Phase 8-only source, capture scripts,
    and both evidence packages.
  - Reconstruct with:
    `cat phase8-untracked-source.tar.gz.part-* > phase8-untracked-source.tar.gz`
  - Reconstructed SHA-256:
    `783b6f698e24ebccc1b6a7d91aa2a83ed53ca95bb1b0f3fd1100925042958754`
  - Part SHA-256:
    `fa720f47bd5ec9d236c325475036c91fe195544b9ad8494aea88817356b024be`
    and
    `339f0c05189562404a977edbcf7c3642632e8b5ba1df10afce70e22c79d38d9f`.

No commit, merge, deployment, or submission was created for this archive.
