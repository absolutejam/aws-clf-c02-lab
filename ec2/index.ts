import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { ComponentResource } from "@pulumi/pulumi";

const config = new pulumi.Config();
const instanceType = config.require("instanceType");
const vpcNetworkCidr = config.require("vpcNetworkCidr");
const publicKey = config.require("publicKey");

// Amazon Linux 2 AMI
const ami = aws.ec2
  .getAmi({
    filters: [
      {
        name: "name",
        values: ["amzn2-ami-hvm-*"],
      },
    ],
    owners: ["amazon"],
    mostRecent: true,
  })
  .then((x) => x.id);

const userData = `#!/bin/bash
echo "Hello, World from Pulumi!" > index.html
nohup python -m SimpleHTTPServer 80 &
`;

const vpc = new aws.ec2.Vpc("vpc", {
  cidrBlock: vpcNetworkCidr,
  enableDnsHostnames: true,
  enableDnsSupport: true,
});

const gateway = new aws.ec2.InternetGateway(
  "gateway",
  { vpcId: vpc.id },
  { parent: vpc }
);

const subnet = new aws.ec2.Subnet(
  "subnet",
  {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    mapPublicIpOnLaunch: true,
  },
  { parent: vpc }
);

const routeTable = new aws.ec2.RouteTable(
  "routeTable",
  {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: "0.0.0.0/0",
        gatewayId: gateway.id,
      },
    ],
  },
  { parent: vpc }
);

const routeTableAssociation = new aws.ec2.RouteTableAssociation(
  "routeTableAssociation",
  {
    subnetId: subnet.id,
    routeTableId: routeTable.id,
  },
  { parent: vpc }
);

const secGroup = new aws.ec2.SecurityGroup(
  "secGroup",
  {
    description: "Enable HTTP access",
    vpcId: vpc.id,
    // Only allow the following protocols
    ingress: [
      {
        fromPort: 80,
        toPort: 80,
        protocol: "tcp",
        cidrBlocks: ["0.0.0.0/0"],
      },
      {
        fromPort: 22,
        toPort: 22,
        protocol: "tcp",
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    // Unrestricted egress
    egress: [
      {
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
  },
  { parent: vpc }
);

const keyPair = new aws.ec2.KeyPair(
  "keypair",
  {
    keyName: "jamesbooth",
    publicKey,
  },
  { parent: vpc }
);

const instance = new aws.ec2.Instance(
  "instance",
  {
    subnetId: subnet.id,
    vpcSecurityGroupIds: [secGroup.id],
    instanceType,
    userData,
    ami,
    keyName: keyPair.keyName,
    tags: {
      Name: "instance-01",
    },
  },
  { parent: vpc }
);

const ipAddress = new aws.ec2.Eip(
  "ipAddress",
  {
    instance: instance.id,
    vpc: true,
  },
  { parent: instance }
);

const ipAssociation = new aws.ec2.EipAssociation(
  "ipAssociation",
  {
    instanceId: instance.id,
    allocationId: ipAddress.id,
  },
  { parent: instance }
);

export const ip = ipAddress.publicIp;
export const hostname = ipAddress.publicDns;
export const url = pulumi.interpolate`http://${ipAddress.publicDns}`;
