import { Catch, ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost){
    const httpResoponse = host.switchToHttp().getResponse();
    const errorResponse = exception.getError();
    console.log(typeof errorResponse);
    console.log('RPC EXCEPTION FILTER - ERROR RESPONSE', errorResponse);
    if (
      typeof errorResponse === 'object' &&
      'code' in  errorResponse &&
      'message' in errorResponse
    ) {
      const { code, message } = errorResponse as any;
      httpResoponse.status(code).json({
        statusCode: code,
        message,
      });
    }
    console.log(httpResoponse)
    return httpResoponse;
  }
}