![verify-gateway-nav](./images/us-east-1/verify-gateway-nav.png) 


# Verify - Gateway Endpoint

We will now verify the configuration to validate it meets the stated requirements.  

## Verify the Gateway Endpoint Configuration

We will start by validating that the S3 bucket policy you added to the restricted bucket enforces the requirement that writes into Amazon S3 occur via our VPC Endpoint.

1.  Refer to the collected output values from your CloudFormation stack.  Note the value of the “RestrictedS3Bucket” and "UnrestrictedS3Bucket" outputs.  You will replace these values in commands below.

**Ensure that your session is connected to the Cloud9 instance.  You will execute steps 2 and 3 from the Cloud9 EC2 instance bash prompt:**
  
2.  Execute the commands provided below AFTER replacing the values of <UnrestrictedS3Bucket> with the output values collected in step 1.  Make note of the results.

``` json
touch test.txt
aws sts get-caller-identity
nslookup s3.amazonaws.com
aws s3 cp test.txt s3://<UnrestrictedS3Bucket>/test.txt
aws s3 rm s3://<UnrestrictedS3Bucket>/test.txt   
```

**Expected behavior** 

|Command   |  Executed from Cloud9 EC2 Instance |   
|---|---|
| aws s3 cp test.txt s3://'UnrestrictedS3Bucket'/test.txt  |  upload |  

**Why does this work ?**

**A.**  The Cloud9 instance is on the public subnet. When you execute the aws s3 cp command, the AWS CLI signs your API request using credentials associated with the identity returned by the aws sts get-caller-identity.  The AWS CLI uses DNS to resolve the address for Amazon Simple Storage Service(S3).  A public address is returned (as output from the nslookup command shows).  The route table for your Cloud9 instance does not have an entry for the VPC Endpoint and traffic destined for S3 is sent to the Internet Gateway using the 0.0.0.0/0 route table entry.  

**B.**  The request is routed to the public IP address of the S3 service.  

**C.**  When the request reaches S3, IAM verifies that the request is authenticated and authorized before completing the request. In this example, the identity signing the request (the active identity signing the request can be seen in output from the aws sts get-caller-identity aws cli command)has permissions to write this object into S3.  IAM permissions assigned to the (administrative) user **ALLOW** data to be written to the unrestricted bucket. The unrestricted bucket does not have a policy.

![figure25](./images/us-east-1/figure25.png) 


3.  Execute the commands provided below AFTER replacing the values of <RestrictedS3Bucket> with the output values collected in step 1.  Make note of the results.

``` json
touch test.txt
aws sts get-caller-identity
nslookup s3.amazonaws.com
aws s3 cp test.txt s3://<RestrictedS3Bucket>/test.txt
aws s3 rm s3://<RestrictedS3Bucket>/test.txt   
```

**Expected behavior** 

|Command   |  Executed from Cloud9 EC2 Instance |   
|---|---|
| aws s3 cp test.txt s3://'RestrictedS3Bucket'/test.txt  |  upload failed |  

**Why does this NOT work ?**

**A.**  The Cloud9 instance is on the public subnet. When you execute the aws s3 cp command, the AWS CLI signs your API request using credentials associated with the identity returned by the aws sts get-caller-identity.  The AWS CLI uses DNS to resolve the address for Amazon Simple Storage Service(S3).  A public address is returned (as output from the nslookup command shows).  The route table for your Cloud9 instance does not have an entry for the VPC Endpoint and traffic destined for S3 is sent to the Internet Gateway using the 0.0.0.0/0 route table entry.  

**B.**  The request is routed to the public IP address of the S3 service.  

**C.**  When the request reaches S3, IAM verifies that the request is authenticated and authorized before completing the request. In this example, the identity signing the request (the active identity signing the request can be seen in output from the aws sts get-caller-identity aws cli command)has permissions to write this object into S3.  IAM permissions assigned to the (administrative) user **ALLOW** data to be written to the unrestricted bucket. The restricted bucket policy will **DENY** s3:putObject calls, because these will occur over the Internet and not via the S3 Gateway VPC endpoint and the resource policy on the restricted bucket will DENY this action. 

![figure26](./images/us-east-1/figure26.png) 

The S3 bucket policy you added to the **restricted** bucket enforces the requirement that writes into Amazon S3 occur via our VPC Endpoint.

**Ensure that your session is connected to the Sales App EC2 instance.  You will execute step 4 from the Sales App EC2 bash prompt.  If you do not already have a session connected to the Sales App EC2 instance execute the following commands from the Cloud9:**

``` json
ssh ec2-user@salesapp -i vpce.pem
```

4.  Execute the commands provided below AFTER replacing the values of <RestrictedS3Bucket> with the output values collected in step 1.  Make note of the results.


``` json
touch test.txt
aws sts get-caller-identity
nslookup s3.amazonaws.com
aws s3 cp test.txt s3://<UnrestrictedS3Bucket>/test.txt
aws s3 rm s3://<UnrestrictedS3Bucket>/test.txt   
```

**Expected behavior When Executed from Sales App EC2 Instance is:** 

|Command   |  Executed from Cloud9 EC2 Instance |   
|---|---|
| aws s3 cp test.txt s3://'UnrestrictedS3Bucket'/test.txt  |  upload failed | 

**Why does this NOT work ?**

**A.**  The SalesApp instance is on the private subnet. When you execute the aws s3 cp command, the AWS CLI signs your API request using credentials associated with the identity returned by the aws sts get-caller-identity - the salesapprole.  The AWS CLI uses DNS to resolve the address for Amazon Simple Storage Service(S3).  The prefix list entry in the private route table dynamically resolves to the public CIDR ranges used by S3.  The associated target in the private route table for all S3 addresses is the S3 Gateway VPC Endpoint.  This route entry is more specific than a 0.0.0.0/0 route and the more specific route takes precedence.  Traffic destined for an S3public IP address is sent to the S3 Gateway VPC Endpoint.  The request is routed to S3 Gateway VPC Endpoint.  The S3 Gateway VPC Endpoint Policy restricts access to **ONLY** the restricted bucketand the request fails.

![figure27](./images/us-east-1/figure27.png) 


* The Sales App EC2 instance sits in a private subnet in your VPC and has a path in its route table to the gateway endpoint.  Calls to S3 are made via the gateway endpoint and access to the bucket occurs over a private network segment. S3:PutObject requests to the unrestricted bucket fail as the gateway endpoint policy will **DENY** access to the unrestricted bucket  
* Access to the restricted bucket is successful.  