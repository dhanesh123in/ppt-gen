# Contributing

## Branching (GitFlow)

| Branch | Role |
|--------|------|
| `main` | Production-ready only |
| `develop` | Integration / default PR target |

| Type | Branch from | Merge into | Name |
|------|-------------|------------|------|
| Feature | `develop` | `develop` | `feature/<short-kebab-name>` |
| Release | `develop` | `main` and `develop` | `release/x.y.z` |
| Hotfix | `main` | `main` and `develop` | `hotfix/x.y.z` |

```bash
git checkout develop && git pull
git checkout -b feature/my-change
# … commits …
# open PR → develop
# after merge, delete the feature branch
```

Do not commit feature work directly to `main` or `develop`. Prefer one concern per feature branch.
