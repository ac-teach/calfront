import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // NestJS devuelve mensajes de class-validator en error.error.message (string o string[])
            const backendMessage = error.error?.message;
            const formattedMessage = Array.isArray(backendMessage)
                ? backendMessage.join(', ')
                : backendMessage || 'Error de conexión con el servidor';

            console.error(`[API Error ${error.status}]:`, formattedMessage);
            return throwError(() => ({
                status: error.status,
                message: formattedMessage,
                raw: error.error,
            }));
        })
    );
};