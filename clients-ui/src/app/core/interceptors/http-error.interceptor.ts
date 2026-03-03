import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

const ERROR_MESSAGES: Record<number, string> = {
  400: 'ID de cliente inválido.',
  404: 'Cliente não encontrado.',
  409: 'Email ou documento já cadastrado.',
  422: 'Dados inválidos. Verifique os campos.',
};

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        toast.error('Não foi possível conectar à API.');
      } else if (error.status >= 500) {
        toast.error('Erro interno do servidor.');
      } else {
        const message = ERROR_MESSAGES[error.status];
        if (message) {
          toast.error(message);
        }
      }
      return throwError(() => error);
    })
  );
};
