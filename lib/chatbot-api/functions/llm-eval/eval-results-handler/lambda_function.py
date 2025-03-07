import os
import boto3
from botocore.exceptions import ClientError
import json
from boto3.dynamodb.conditions import Key
from datetime import datetime
from decimal import Decimal

# Retrieve DynamoDB table names from environment variables
EVALUATION_SUMMARIES_TABLE = os.environ["EVALUATION_SUMMARIES_TABLE"]
EVALUATION_RESULTS_TABLE = os.environ["EVALUATION_RESULTS_TABLE"]

# Initialize a DynamoDB resource using boto3
dynamodb = boto3.resource("dynamodb", region_name='us-east-1')

# Connect to the specified DynamoDB tables
summaries_table = dynamodb.Table(EVALUATION_SUMMARIES_TABLE)
results_table = dynamodb.Table(EVALUATION_RESULTS_TABLE)

def convert_from_decimal(item):
    if isinstance(item, list):
        return [convert_from_decimal(i) for i in item]
    elif isinstance(item, dict):
        return {k: convert_from_decimal(v) for k, v in item.items()}
    elif isinstance(item, Decimal):
        return float(item)  # Convert Decimal to float
    else:
        return item

# # function to add a new evaluation (summary and detailed results) to DynamoDB
# def add_evaluation(evaluation_id, evaluation_name, average_similarity,
#                    average_relevance, average_correctness, total_questions, detailed_results, test_cases_key):
#     try:
#         timestamp = str(datetime.now())
#         # eval id is len of summaries table
#         # Add evaluation summary
#         summary_item = {
#             'EvaluationId': evaluation_id,
#             'Timestamp': timestamp,
#             'average_similarity': Decimal(str(average_similarity)),
#             'average_relevance': Decimal(str(average_relevance)),
#             'average_correctness': Decimal(str(average_correctness)),
#             'total_questions': total_questions,
#             'evaluation_name': evaluation_name.strip() if evaluation_name else None,
#             'test_cases_key': test_cases_key
#         }
#         print("summary_item: ", summary_item)

#         # Remove None values
#         summary_item = {k: v for k, v in summary_item.items() if v is not None}

#         summaries_table.put_item(Item=summary_item)

#         # Add detailed results (batch write)
#         with results_table.batch_writer() as batch:
#             for idx, result in enumerate(detailed_results):
#                 result_item = {
#                     'EvaluationId': evaluation_id,
#                     'QuestionId': str(idx),
#                     'question': result['question'],
#                     'expected_response': result['expectedResponse'],
#                     'actual_response': result['actualResponse'],
#                     'similarity': Decimal(str(result['similarity'])),
#                     'relevance': Decimal(str(result['relevance'])),
#                     'correctness': Decimal(str(result['correctness'])),
#                     'test_cases_key': test_cases_key
#                 }
#                 print("result_item: ", result_item)
#                 batch.put_item(Item=result_item)

#         return {
#             'statusCode': 200,
#             'headers': {'Access-Control-Allow-Origin': '*'},
#             'body': json.dumps({'message': 'Evaluation added successfully'})
#         }
#     except ClientError as error:
#         print("Caught error: DynamoDB error - could not add evaluation")
#         return {
#             'statusCode': 500,
#             'headers': {'Access-Control-Allow-Origin': '*'},
#             'body': json.dumps(str(error))
#         }

# function to retrieve all summaries from DynamoDB
def get_evaluation_summaries(continuation_token=None, limit=10):
    try: 
        try:
            # First try with PartitionKey
            query_params = {
                "KeyConditionExpression": Key("PartitionKey").eq("Evaluation"),  # Match all evaluations
                "ProjectionExpression": "#eid, #ts, #as, #ar, #ac, #tq, #en, #tk",
                "ExpressionAttributeNames": {
                    "#eid": "EvaluationId",
                    "#ts": "Timestamp",  # Reserved keyword
                    "#as": "average_similarity",
                    "#ar": "average_relevance",
                    "#ac": "average_correctness",
                    "#tq": "total_questions",
                    "#en": "evaluation_name",
                    "#tk": "test_cases_key"
                },
                "Limit": limit,
                "ScanIndexForward": False  # Get the most recent evaluations first
            }
            # Add continuation token if provided
            if continuation_token:
                query_params["ExclusiveStartKey"] = continuation_token
            response = summaries_table.query(**query_params)
            items = response.get('Items', [])
            last_evaluated_key = response.get('LastEvaluatedKey')
        except ClientError as partition_error:
            print(f"Error querying with PartitionKey: {str(partition_error)}")
            print("Falling back to scan operation")
            
            # Fallback to scan if PartitionKey doesn't exist
            scan_params = {
                "Limit": limit
            }
            if continuation_token:
                scan_params["ExclusiveStartKey"] = continuation_token
            
            response = summaries_table.scan(**scan_params)
            items = response.get('Items', [])
            last_evaluated_key = response.get('LastEvaluatedKey')

        # Sort items to return most recent evaluations first if Timestamp exists
        if items and 'Timestamp' in items[0]:
            items = sorted(items, key=lambda x: x.get('Timestamp', ''), reverse=True)
            
        response_body = {
            'Items': convert_from_decimal(items),
            'NextPageToken': last_evaluated_key
        }

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(response_body)
        }
    except ClientError as error:
        print("Caught error: DynamoDB error - could not retrieve evaluation summaries")
        print("error: ", error)
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(str(error))
        }

# function to retrieve detailed results for a specific evaluation from DynamoDB
def get_evaluation_results(evaluation_id, continuation_token=None, limit=10):
    try:
        query_params = {
            'KeyConditionExpression': boto3.dynamodb.conditions.Key('EvaluationId').eq(evaluation_id),
            'Limit': limit
        }
        if continuation_token:
            query_params['ExclusiveStartKey'] = continuation_token
        
        # Query the results table for the given evaluation_id
        response = results_table.query(**query_params)
        print("response from eval handler: ", response)
        items = response.get('Items', [])
        last_evaluated_key = response.get('LastEvaluatedKey')

        # Sort items by QuestionId and build response body
        sorted_items = sorted(items, key=lambda x: int(x['QuestionId']))
        
        # Add question_id field for frontend compatibility
        for item in sorted_items:
            item['question_id'] = item['QuestionId']
            
        response_body = {
            'Items': convert_from_decimal(sorted_items),
            'NextPageToken': last_evaluated_key
        }

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(response_body)
        }
    except ClientError as error:
        print("Caught error: DynamoDB error - could not retrieve evaluation results")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(str(error))
        }

def lambda_handler(event, context):
    # Add CORS headers for all responses
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }
    
    # Handle OPTIONS request (preflight)
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'CORS preflight request successful'})
        }
    
    try:
        data = json.loads(event['body']) if 'body' in event else event
        operation = data.get('operation')
        evaluation_id = data.get('evaluation_id')
        continuation_token = data.get('continuation_token')
        limit = data.get('limit', 10)

        if operation == 'get_evaluation_summaries':
            result = get_evaluation_summaries(continuation_token, limit)
            # Add CORS headers to the result
            if 'headers' in result:
                result['headers'].update(headers)
            else:
                result['headers'] = headers
            return result
        elif operation == 'get_evaluation_results':
            if not evaluation_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps('evaluation_id is required for retrieving evaluation results.')
                }
            result = get_evaluation_results(evaluation_id, continuation_token, limit)
            # Add CORS headers to the result
            if 'headers' in result:
                result['headers'].update(headers)
            else:
                result['headers'] = headers
            return result
        else:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps(f'Operation not found/allowed! Operation Sent: {operation}')
            }
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps(f'Internal server error: {str(e)}')
        }