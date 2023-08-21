# ec2

Managing EC2 instances.

## Deployment

```bash
export PULUMI_CONFIG_PASSPHRASE=<passphrase>
pulumi preview
pulumi up
```

## Connecting to the instance

Check the HTTP response:

```bash
curl $(pulumi stack output url)
```

SSH to the instance:

```bash
ssh -i ~/.ssh/<ssh-key> ec2-user@$(pulumi stack output hostname)
```
