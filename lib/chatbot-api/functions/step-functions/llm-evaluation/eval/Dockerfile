FROM public.ecr.aws/lambda/python:3.12


# Copy function code
COPY lambda_function.py ${LAMBDA_TASK_ROOT}
COPY api_client.py ${LAMBDA_TASK_ROOT}

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

# Download nltk data for text processing
RUN python -m nltk.downloader -d ${LAMBDA_TASK_ROOT}/nltk_data punkt stopwords

# Set default environment variables for authentication fallbacks
ENV AUTH_ENDPOINT=""
ENV USE_DUMMY_RESPONSES_ON_401="true"

# Set the CMD to your handler (function name)
CMD ["lambda_function.lambda_handler"]
