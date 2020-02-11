The lab is broken into 4 sections during which you will build and verify Gateway and Interface Endpoints:
* [Section 1: Build-Gateway Endpoint](https://github.com/harrisn6/vpc-endpoints-lab/blob/master/build-gateway.md) 
* Section 2: Build-Interface Endpoint 
* [Section 3: Verify-Gateway Endpoint](https://github.com/harrisn6/vpc-endpoints-lab/blob/master/verify-gateway.md) 
* [Section 4: Verify-Interface Endpoint](https://github.com/harrisn6/vpc-endpoints-lab/blob/master/verify-interface.md) 

You are on Section 2: Build Interface

![build-interface-nav](./images/us-east-1/build-interface-nav.png) 

# Build - Interface Endpoint

You will now examine/update configurations to control access to resources and ensure data to SQS is transmitted on private network segments via an SQS Interface VPC Endpoint

## Securing Access to the SQS Queue using a Interface Endpoint - Overview

![figure17](./images/us-east-1/figure18.png)  

* **Part 1.  Interface Endpoint - IAM Roles**.  The EC2 instances will use an IAM Role with associated IAM policies which provide permissions to execute API calls against SQS.  [See IAM roles for EC2 instances for more information.](https://aws.amazon.com/blogs/aws/iam-roles-for-ec2-instances-simplified-secure-access-to-aws-service-apis-from-ec2/)
* **Part 2.  Interface Endpoint - Security Groups**.  You will restrict network access to the SQS Interface VPC endpoint using security groups.  The security group rules will only allow inbound access from private subnets in your VPC. 
* **Part 3.  Interface Endpoint - Interface Endpoint Resource Policy**.  Access to the SQS service will be restricted by an Interface Endpoint policy which allows access to a specific queue only and to IAM Principals within your AWS account only.      
* **Part 4.  Interface Endpoint - SQS Queue Resource Policy**. Access to complete sqs:SendMessage, sqs:RecieveMessage or sqs:DeleteMessage API calls will be restricted by a resource policy (an Amazon SQS policy) that requires all messages written to the SQS queue are written via the specified VPC endpoint.

## Part 1: Interface Endpoint - IAM Roles

![figure19](./images/us-east-1/figure19.png)  

(Optional) Review the IAM permissions in your lab:

1.  Revisit (if required) the IAM permissions assigned to the Sales App and Reports Engine EC2 instances as covered during Section 1 Part 1: Gateway Endpoint IAM Roles.  Notice that the SalesApp role has the permissions to execute "sqs:SendMessage" and "sqs:ReceiveMessage". Notice that the ReportsEngine role has the permissions to execute "sqs:ReceiveMessage" and "sqs:DeleteMessage"

## Part 2. Interface Endpoint - Security Groups

![figure20](./images/us-east-1/figure20.png)  

Review the security group configuration in your lab:

1.	Refer to the collected output values from your CloudFormation stack.  Note the value of the “InterfaceSecurityGroupURL” output.  This is the URL to review the security group associated with your interface endpoint.  Also note the values of the “SecurityGroupForReportsEngine” and "SecurityGroupForSalesApp" outputs.   
2.	Paste the InterfaceSecurityGroupURL value in your browser and select the security group in the top pane.
3.	Click on the Inbound tab in the lower pane to see inbound security group rules.  The development team have restricted access to the CIRD range 10.0.0.0/8.
	
![figure21](./images/us-east-1/figure21.png)

4.	Further restrict the inbound rules.  Update the existing inbound security group rule by clicking the Edit button in the lower pane.  Remove the existing rule (10.0.0.0/8).  Create two new inbound rules with the following attributes(updating the sg- values with the outputs from your Cloudformation stack):
	
| Type |  Protocol  |  Port Range  |    Source      |      Description                                    |
|-------------------------------------------------------|----|----|----------|------------------------------------------|
| All TCP | TCP | 0-65535 | Custom  sg-XXXX | Inbound from SecurityGroupForSalesApp |
| All TCP | TCP | 0-65535 | Custom  sg-YYYY | Inbound from SecurityGroupForReportsEngine |
 
![secgrps2](./images/us-east-1/secgrps2.png)  

Save your changes to further constrain network access to the interface endpoint and the SQS queue it provides access to.  

![secgrps3](./images/us-east-1/secgrps3.png)  

For additional information regarding security group rule updates refer to the AWS documentation:  Ref: https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html#AddRemoveRules
  
## Part 3. Interface Endpoint - Interface Endpoint Resource Policy 

![figure22](./images/us-east-1/figure22.png)  

A VPC Interface policy controls access to an Interface endpoint.  We will use it to restrict access to identities that exist within this AWS account only.

Update the Interface Endpoint policy in your lab (an template/example is provided below):

1. Refer to the collected output values from your CloudFormation stack.  Note the value of the “InterfaceEndpointPolicyURL” output. Copy this value and paste it into your browser to access the Interface Endpoint in your VPC dashboard.
2. Select the policy tab in the lower pane of your Interface Endpoint 
3. Refer to the value of the “AWSAccountID” output from your CloudFormation stack.  This is the AWS Account ID being used for this lab.
4. Use the example resource policy below. Replace the placeholder value “exampleaccountid” with the AWS Account ID value.  Replace the value of "examplequeueARN" with the output value named SQSQueueARN	from your CloudFormation stack.
5. Edit the Interface Endpoint policy on your Interface Endpoint for SQS.  Enter the custom policy you have created based on the example below. Save and close.

**Resource policy - Interface Endpoint policy template/example**     

``` json
{
   "Statement": [{
      "Action": ["sqs:SendMessage","sqs:ReceiveMessage","sqs:DeleteMessage"],
      "Effect": "Allow",
      "Resource": "examplequeueARN",
      "Principal": { "AWS": "exampleaccountid" }
   }]
}	
``` 

## Part 4. Interface Endpoint - SQS Queue Resource Policy  

![figure23](./images/us-east-1/figure23.png) 

1.	Access the SQS Console in your browser at https://console.aws.amazon.com/sqs/home?region=us-east-1#
2.	Refer to the collected output values from your CloudFormation stack.  Note the value of the “SQSQueueName” output.  This is your SQS Queue.
3.	Select your SQS Queue in the upper pane of the AWS console.  Details for the endpoint are presented in the lower pane.  
4.	In the lower main pane, select the tab titled “Permissions” and then click on “Edit Policy Document (Advanced)”.  A popup window appears..

Update the SQS policy in your lab (a template/example is provided below):

5.  Refer to the collected output values from your CloudFormation stack.  Note the value of the “SQSQueueARN” output.  This is your SQS Queue ARN.
6.  Replace the placeholder value “sqsexampleARN” with the queue ARN for the queue created during CloudFormation lab setup and captured from the outputs table (format will be arn:aws:sqs:<region>:exampleacctid:examplequeuename)
7.  Refer to the collected output values from your CloudFormation stack.  Note the value of the “SQSVPCInterfaceEndpoint” output.  This is your Interface VPC Endpoint.
8.  Replace the example vpcid string “vpce-vpceid” with the ID of the Interface VPC endpoint created during CloudFormation lab setup and captured from the outputs table (format will be vpce-xxxxx)
9.  Having updated the example policy (below) with values for your resources, update the SQS queue resource policy in the popup window...   
10. Click review changes.  Click Save Changes. The queue with updated resource policy will display in the console..

**Resource policy - SQS Queue resource policy template/example**    

``` json
 {
  "Version": "2012-10-17",
  "Id": "vpc-endpoints-lab-sqs-queue-resource-policy",
  "Statement": [
    {
      "Sid": "all-messages-sent-from-interface-vpc-endpoint",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "sqs:SendMessage",
      "Resource": "sqsexampleARN",
      "Condition": {
        "StringEquals": {
          "aws:sourceVpce": "vpce-vpceid"
        }
      }
    },
    {
      "Sid": "all-messages-received-from-interface-vpc-endpoint",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "sqs:ReceiveMessage",
      "Resource": "sqsexampleARN",
      "Condition": {
        "StringEquals": {
          "aws:sourceVpce": "vpce-vpceid"
        }
      }
    },
    {
      "Sid": "all-messages-deleted-from-interface-vpc-endpoint",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "sqs:DeleteMessage",
      "Resource": "sqsexampleARN",
      "Condition": {
        "StringEquals": {
          "aws:sourceVpce": "vpce-vpceid"
        }
      }
    }

  ]
} 
```

**Important Interface Endpoint Considerations**: 

* When you create an interface endpoint, we generate endpoint-specific DNS hostnames that you can use to communicate with the service. For AWS services and AWS Marketplace Partner services, private DNS (enabled by default) associates a private hosted zone with your VPC. The hosted zone contains a record set for the default DNS name for the service (for example, ec2.us-east-1.amazonaws.com) that resolves to the private IP addresses of the endpoint network interfaces in your VPC. This enables you to make requests to the service using its default DNS hostname instead of the endpoint-specific DNS hostnames. For example, if your existing applications make requests to an AWS service, they can continue to make requests through the interface endpoint without requiring any configuration changes. 
For each interface endpoint, you can choose only one subnet per Availability Zone.
* By default, each interface endpoint can support a bandwidth of up to 10 Gbps per Availability Zone. Additional capacity can be added automatically based on your usage. 
* An interface endpoint supports TCP traffic only.
* Endpoints are supported within the same Region only. You cannot create an endpoint between a VPC and a service in a different Region. 

---

**Congratulations !!!**  You can now move on to the [**Verify - Gateway Endpoint**](./verify-gateway.md) section !