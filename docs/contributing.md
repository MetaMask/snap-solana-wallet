# Contributing

Make sure you have followed all the setup steps from

- [The main README](../README.md)
- [The snap README](../packages/snap/README.md)

## Branches

We strongly recommend to use the "Create branch" feature from Jira, this will generate a well named branch including tiket id (ie: `SOL-10`) and ticket description.

## Commits

We use `commitlint` for linting our commits, this means we will needs to follow [conventional commits format](https://www.conventionalcommits.org/en/v1.0.0/), this will help later with generating a CHANGELOG.

> [!IMPORTANT]  
> A git hook is been setup in order to lint your commit message and fix your formatting and linting issues.

> [!TIP]
> We recommend `feat` and `fix` categories in order to have a clean CHANGELOG

## Push

When pushing to a branch, we will automatically run test in order to make sure all the previous functionality works as expected after your changes.

## PRs

In order to generate a good PR

- All the steps need to pass
- Needs to have a good description
- Needs to be linked with a ticket (Use the create branch feature from Jira)
- Needs to include tests
