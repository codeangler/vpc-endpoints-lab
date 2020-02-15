#!/bin/sh
TAG_NAME="aws:cloudformation:stack-name"
INSTANCE_ID="`wget -qO- http://instance-data/latest/meta-data/instance-id`"
REGION=`aws configure get region`
TAG_VALUE="`aws ec2 describe-tags --filters "Name=resource-id,Values=$INSTANCE_ID" "Name=key,Values=$TAG_NAME" --region $REGION --output=text | cut -f5`"
aws --region $REGION ssm get-parameter --name vpce --with-decryption --output text --query Parameter.Value > ~/environment/vpce.pem
#add proper carriage returns
sed -i 's/\\n/\n/g' ~/environment/vpce.pem
#correct perms
sudo chmod 400 ~/environment/vpce.pem
#add an /etc/hosts entries for convenient SSH 
salesappip=`aws ssm get-parameter --name salesappip --output text --query Parameter.Value`
reportsengineip=`aws ssm get-parameter --name reportsengineip --output text --query Parameter.Value`
echo "SSH key configured:"
ls -lart ~/environment/vpce.pem
echo " "
echo -e "\e[1;35m Adding entries in /etc/hosts for convenient SSH: \e[0m"
echo " $salesappip     salesapp" | sudo tee -a /etc/hosts
echo " $reportsengineip     reportsengine" | sudo tee -a /etc/hosts
echo " "
# echo the ssh string to connect to Sales App
echo -e " "
echo -e "\e[1;31m  Connect to the Sales Application EC2 host using: \e[0m"
echo "ssh ec2-user@salesapp -i vpce.pem"
# echo the ssh string to connect to Reports Engine
echo " "
echo -e "\e[1;33m  Connect to the Reports Engine EC2 host using: \e[0m"
echo "ssh ec2-user@reportsengine -i vpce.pem"
echo " "
echo " "