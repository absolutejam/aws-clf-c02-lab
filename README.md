# aws-clf-c02-lab

Components to spin up infrastructure required by the
**AWS Cloud Practitioner** exam, using Pulumi.

## State storage

The simplest method is to use local state storage:

```bash
# (inside Pulumi project)
pulumi login file://${PWD}/.state
```
