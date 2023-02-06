# Docker Config file to package container for application to deploy serverlessly on AWS Lambda

FROM public.ecr.aws/lambda/python:3.9

RUN yum update -y
RUN yum install opencv -y 
RUN pip3 install --upgrade pip
RUN pip3 install peekingduck

COPY app.py ${LAMBDA_TASK_ROOT}
COPY pipeline.py ${LAMBDA_TASK_ROOT}
COPY src/ ${LAMBDA_TASK_ROOT}
COPY pipeline_config.yml ${LAMBDA_TASK_ROOT}

CMD [ "app.lambda_handler" ]