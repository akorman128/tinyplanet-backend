import {
  HttpStatus,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipeOptions,
} from '@nestjs/common';

function generateErrors(errors: ValidationError[]) {
  return errors.reduce(
    (accumulator, currentValue) => ({
      ...accumulator,
      [currentValue.property]:
        (currentValue.children?.length ?? 0) > 0
          ? generateErrors(currentValue.children ?? [])
          : Object.values(currentValue.constraints ?? {}).join(', '),
    }),
    {},
  );
}

function generateMessage(errors: ValidationError[]): string {
  return errors
    .map((error) =>
      error.children?.length
        ? generateMessage(error.children)
        : Object.values(error.constraints ?? {}).join(', '),
    )
    .join('; ');
}

const validationOptions: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  exceptionFactory: (errors: ValidationError[]) => {
    const errorDetails = generateErrors(errors);
    const message = generateMessage(errors);

    return new UnprocessableEntityException({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      message: message,
      errors: errorDetails,
    });
  },
};

export default validationOptions;
